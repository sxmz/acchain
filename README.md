# Acchain



## System Dependency

- nodejs v6.3.1+
- npm 3.10.3+ (not cnpm)
- sqlite v3.8.2+
- g++
- libssl

## Install node_modules

```
npm install
```

## Run

```
node app.js
```

## Usage

```
node app.js --help

  Usage: app [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -c, --config <path>        Config file path
    -p, --port <port>          Listening port number
    -a, --address <ip>         Listening host name or ip
    -b, --blockchain <path>    Blockchain db path
    -g, --genesisblock <path>  Genesisblock path
    -x, --peers [peers...]     Peers list
    -l, --log <level>          Log level
    -d, --daemon               Run asch node as daemon
    --reindex                  Reindex blockchain
    --base <dir>               Base directory
```

## Front end (wallet ui)

```
cd public
npm install -g
gulp build-testnet
npm start serve
```

Then you can open ```localhost:8008``` in you browser

## Default localnet genesis account

You can use this account to test acchain immediately

```
{
  "keypair": {
    "publicKey": "67ac5286a374c053df43c5376bd2294c20e0defd61aa6596bb747f16e87d44b6",
    "privateKey": "09e5169152d3590877026995c02456cdc01698876498b6fe6f906db11be0d92f67ac5286a374c053df43c5376bd2294c20e0defd61aa6596bb747f16e87d44b6"
  },
  "address": "ALbSNySoqbJYomcJCpMcBdyv1os6aRZ4v",
  "secret": "debris prosper crush furnace bomb start problem regular abandon ice artefact clay"
}
```

## Releated projects

- [acchain_docs](https://github.com/sxmz/acchain_docs)

## License

The MIT License (MIT)

Copyright (c) 2017 Guiyang Blockchain Finance Co.Ltd</br>
Copyright (c) 2016 Asch</br>
Copyright (c) 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
