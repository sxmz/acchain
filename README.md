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

```
{
  "keypair": {
    "publicKey": "8065a105c785a08757727fded3a06f8f312e73ad40f1f3502e0232ea42e67efd",
    "privateKey": "a64af28537545301f66579604628b55c7a7a102752bbd8f0b0d152f9754e78d58065a105c785a08757727fded3a06f8f312e73ad40f1f3502e0232ea42e67efd"
  },
  "address": "14762548536863074694",
  "secret": "someone manual strong movie roof episode eight spatial brown soldier soup motor"
}
```

## Releated projects

- [acchain_docs](http://git.oschina.net/sxmz/acchain_docs)

## License

The MIT License (MIT)

Copyright (c) 2017 GYQKL BLOCKCHAIN</br>
Copyright (c) 2017 Acchain</br>
Copyright (c) 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.