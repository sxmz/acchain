angular.module('acchain').service('userService', function () {
    this.setData = function (secret, address, publicKey, balance, secondPublicKey) {
        this.secret = secret;
        this.address = address;
        this.publicKey = publicKey;
        this.balance = balance;
        this.secondPublicKey = secondPublicKey;
        if (window.localStorage) {
            window.localStorage.setItem('secret', secret);
            window.localStorage.setItem('address', address);
            window.localStorage.setItem('publicKey', publicKey);
            window.localStorage.setItem('balance', balance);
            window.localStorage.setItem('secondPublicKey', secondPublicKey);
        }
    }
    this.update = function (account) {
        this.balance = account.balance;
        this.secondPublicKey = account.secondPublicKey;
        if (window.localStorage) {
            window.localStorage.setItem('balance', account.balance);
            window.localStorage.setItem('secondPublicKey', account.secondPublicKey);
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
