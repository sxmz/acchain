angular.module('asch').service('userService', function () {
    this.setData = function (secret, address, publicKey, balance, secondPublicKey) {
        this.secret = secret;
        this.address = address;
        this.publicKey = publicKey;
        this.balance = balance;
        this.secondPublicKey = secondPublicKey;
        if (window.sessionStorage) {
            window.sessionStorage.setItem('secret', secret);
            window.sessionStorage.setItem('address', address);
            window.sessionStorage.setItem('publicKey', publicKey);
            window.sessionStorage.setItem('balance', balance);
            window.sessionStorage.setItem('secondPublicKey', secondPublicKey);
        }
    }
    this.update = function (account) {
        this.balance = account.balance;
        this.secondPublicKey = account.secondPublicKey;
        if (window.sessionStorage) {
            window.sessionStorage.setItem('balance', account.balance);
            window.sessionStorage.setItem('secondPublicKey', account.secondPublicKey);
        }
    }
    this.saveTab = function (tab) {
        this.tab = tab;
    };
    this.isStatus = function (tab) {
        this.issuerStatus = tab;
    };
    this.isName = function (name) {
        this.name = name;
    };

});
