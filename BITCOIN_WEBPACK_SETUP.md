# Настройка React приложения для работы с Bitcoin библиотеками

## 🚨 Проблема

При использовании Bitcoin библиотек в React приложении (таких как `bitcoinjs-lib`, `@oyl/sdk`, `alkanes`, `@omnisat/lasereyes-core`) возникают ошибки webpack:

```
ERROR in ./node_modules/@oyl/sdk/lib/signer/signer.js 11:41-58
Module not found: Error: Can't resolve 'crypto' in '/Users/.../node_modules/@oyl/sdk/lib/signer'

BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
This is no longer the case. Verify if you need this module and configure a polyfill for it.
```

## 🔍 Причина проблемы

**Webpack 5** больше не включает автоматические полифиллы для Node.js модулей. Bitcoin библиотеки используют модули Node.js (`crypto`, `buffer`, `stream`, `path`, etc.), которые не существуют в браузере.

Bitcoin операции требуют:
- **Криптографические функции** (`crypto`) - для подписей транзакций
- **Буферы** (`buffer`) - для работы с бинарными данными
- **Потоки данных** (`stream`) - для обработки данных
- **Системные утилиты** (`path`, `os`) - для файловых операций

## ✅ Решение

### 1. Установка react-app-rewired

```bash
yarn add react-app-rewired
```

`react-app-rewired` позволяет кастомизировать webpack конфигурацию без eject.

### 2. Установка полифиллов

#### Основные полифиллы:
```bash
yarn add buffer crypto-browserify https-browserify os-browserify process stream-browserify stream-http assert url
```

#### Dev зависимости:
```bash
yarn add -D path-browserify vm-browserify
```

### 3. Обновление package.json

Замените стандартные scripts на react-app-rewired:

```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false react-app-rewired build",
    "test": "react-app-rewired test",
    "eject": "react-scripts eject"
  }
}
```

### 4. Создание config-overrides.js

Создайте файл `config-overrides.js` в корне проекта:

```javascript
const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "assert": require.resolve("assert"),
    "buffer": require.resolve("buffer"),
    "crypto": require.resolve("crypto-browserify"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("stream-http"),
    "os": require.resolve("os-browserify/browser"),
    "path": require.resolve("path-browserify"),
    "process": require.resolve("process/browser.js"),
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url"),
    "vm": require.resolve("vm-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "readline": false,
    "zlib": false
  };

  // Настройки для ES модулей
  config.resolve.extensionAlias = {
    ...config.resolve.extensionAlias,
    ".js": [".ts", ".tsx", ".js", ".jsx"],
    ".mjs": [".mts", ".mjs"]
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser.js"
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
    })
  ];

  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency: the request of a dependency is an expression/,
  ];

  // Отключение требования полной спецификации для модулей
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  return config;
};
```

## 📋 Объяснение полифиллов

| Оригинальный модуль | Полифилл | Зачем нужен |
|---------------------|----------|-------------|
| `crypto` | `crypto-browserify` | Криптографические операции (хеширование, подписи) |
| `buffer` | `buffer` | Работа с бинарными данными (ключи, транзакции) |
| `stream` | `stream-browserify` | Потоки данных для обработки |
| `https` | `https-browserify` | HTTPS запросы к Bitcoin API |
| `http` | `stream-http` | HTTP запросы |
| `path` | `path-browserify` | Работа с путями файлов |
| `os` | `os-browserify` | Информация об операционной системе |
| `process` | `process` | Переменные окружения и процесс |
| `url` | `url` | Парсинг URL адресов |
| `vm` | `vm-browserify` | Выполнение JavaScript кода |
| `assert` | `assert` | Утверждения для тестирования |

### Отключенные модули:
- `fs`, `net`, `tls` - файловая система и сеть (недоступны в браузере)
- `child_process`, `readline`, `zlib` - системные процессы

## 🔧 Ключевые настройки webpack

### ProvidePlugin
```javascript
new webpack.ProvidePlugin({
  Buffer: ["buffer", "Buffer"],
  process: "process/browser.js"
})
```
Автоматически подключает `Buffer` и `process` в модули, которые их используют.

### DefinePlugin
```javascript
new webpack.DefinePlugin({
  global: 'globalThis',
})
```
Заменяет `global` на `globalThis` для совместимости с браузером.

### fullySpecified: false
```javascript
{
  test: /\.m?js$/,
  resolve: {
    fullySpecified: false,
  },
}
```
Отключает требование полных путей для ES модулей.

## 🚀 Запуск

После настройки:

1. Очистите кэш:
```bash
rm -rf node_modules/.cache
```

2. Запустите приложение:
```bash
yarn start
```

## ⚠️ Возможные проблемы

### 1. Ошибка "Can't resolve 'process/browser'"
**Решение:** Убедитесь что используете `process/browser.js` с расширением.

### 2. "Cannot read properties of undefined (reading 'module')"
**Решение:** Добавьте `fullySpecified: false` в правила модулей.

### 3. Buffer не определен
**Решение:** Проверьте ProvidePlugin настройки для Buffer.

### 4. Большой размер bundle
**Решение:** Полифиллы увеличивают размер. Рассмотрите code splitting.

## 📦 Минимальный package.json

```json
{
  "dependencies": {
    "@omnisat/lasereyes-core": "^0.0.70",
    "@omnisat/lasereyes-react": "0.2.1",
    "@oyl/sdk": "https://github.com/Oyl-Wallet/oyl-sdk",
    "bitcoinjs-lib": "^6.1.7",
    "alkanes": "kungfuflex/alkanes",
    "assert": "^2.1.0",
    "buffer": "^6.0.3",
    "crypto-browserify": "^3.12.1",
    "https-browserify": "^1.0.0",
    "os-browserify": "^0.3.0",
    "process": "^0.11.10",
    "react-app-rewired": "^2.2.1",
    "stream-browserify": "^3.0.0",
    "stream-http": "^3.2.0",
    "url": "^0.11.4"
  },
  "devDependencies": {
    "path-browserify": "^1.0.1",
    "vm-browserify": "^1.1.2"
  }
}
```

## ✅ Проверка работы

После настройки Bitcoin хуки должны работать без ошибок:

```javascript
import { useClockIn } from './hooks/useClockIn';

function App() {
  const { executeClockIn } = useClockIn();
  
  // Bitcoin операции работают!
  return <div>Bitcoin App Ready!</div>;
}
```

## 🔗 Альтернативы

### Vite конфигурация

Если используете Vite вместо webpack:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      // ... остальные алиасы
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process']
  }
});
```

---

**Результат:** Полная поддержка Bitcoin библиотек в React приложении с правильной настройкой webpack полифиллов. 