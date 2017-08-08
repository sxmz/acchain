angular.module('asch').controller('payCtrl', function ($scope, $rootScope, $filter, apiService, ipCookie, $http, $window, userService, postSerivice, $translate) {
    $rootScope.active = 'pay';
    $rootScope.userlogin = true;
	$scope.userService = userService;
    $scope.sent = userService.address;
    $scope.fee = '0.01';
    $scope.currencyRange = [];
    var currency = $rootScope.currencyName === undefined ? null : $rootScope.currencyName;
    var precision = $rootScope.currencyName === undefined ? 6 : $rootScope.precision;
   //初始化下拉框
    apiService.myBalances({
        address: userService.address
    }).success(function (res) {
 	   $scope.currencyRange = res.balances;
 	   $scope.currencyRange.unshift({
			currency: "ACC",
			precision: 6
	   });
	   for( var i=0;i<$scope.currencyRange.length;i++){
        	if($scope.currencyRange[i].currency == currency){
       			$scope.selectedCurrency = $scope.currencyRange[i];
       		}
       	}
    }).error(function (res) {
       toastError($translate.instant('ERR_SERVER_ERROR'));
    });	
	$scope.currencyChange = function(){
        currency = $scope.selectedCurrency.currency === 'ACC' ? null : $scope.selectedCurrency.currency;
        precision = $scope.selectedCurrency.currency === 'ACC' ? 6 : $scope.selectedCurrency.precision;
   }
    $scope.calculateFee = function () {
        if ($scope.amount && Number($scope.amount) > 0) {
        	var precision_treated = Math.pow(10,precision);
            var amount = parseFloat(($scope.amount * precision_treated).toFixed(0));
            var fee = AcchainJS.transaction.calculateFee(amount);
            $scope.fee = $filter('xasFilter')(fee);
        }
    }
    $scope.sentMsg = function () {
        var isAddress = /^[0-9]{1,21}$/g;
        var transaction;
        if($scope.selectedCurrency == undefined){
        	toastError($translate.instant('ERR_AMOUNT_INVALID'));
        }else{
        	currency = $scope.selectedCurrency.currency === 'ACC' ? null : $scope.selectedCurrency.currency;

        }
        if (!$scope.fromto) {
            toastError($translate.instant('ERR_NO_RECIPIENT_ADDRESS'));
            return false;
        }
        // if (!isAddress.test($scope.fromto)) {
        //     toastError($translate.instant('ERR_RECIPIENT_ADDRESS_FORMAT'));
        //     return false;
        // }
        if ($scope.fromto == userService.address) {
            toastError($translate.instant('ERR_RECIPIENT_EQUAL_SENDER'));
            return false;
        }
        if (!$scope.amount || Number($scope.amount) <= 0) {
            toastError($translate.instant('ERR_AMOUNT_INVALID'));
            return false;
        }
        
        var amount = parseFloat(($scope.amount * Math.pow(10,precision)).toFixed(0));
        //var fee = 100000;
        
        if (userService.secondPublicKey && !$scope.secondPassword) {
            toastError($translate.instant('ERR_NO_SECND_PASSWORD'));
            return false;
        }
        if (!userService.secondPublicKey) {
            $scope.secondPassword = '';
        }
        transaction = AcchainJS.transaction.createTransaction(String($scope.fromto), amount.toString(), currency, $scope.remark, userService.secret, $scope.secondPassword);
        postSerivice.post(transaction).success(function (res) {
            if (res.success == true) {
                $scope.passwordsure = true;
                $scope.fromto = '';
                $scope.amount = '';
                $scope.secondPassword = '';
                $scope.remark = '';
                toast($translate.instant('INF_TRANSFER_SUCCESS'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    }
});
