# Asch frontend

## Development dependency

- nodejs
- npm
- bower
- gulp

## Install dependency

```
bower install
npm install
```

## Build

### Browserify

```
npm run build
```

### Realtime build for local dev

```
gulp serve
```

Then access localhost:8080 to debug the ui with statc mock http interface

### Build for testnet

```
gulp build-test
```

### Build for mainnet

```
gulp build-main
```