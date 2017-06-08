angular.module('asch').controller('loginCtrl', function ($scope, $rootScope, apiService, ipCookie, $window, $location, userService, $translate) {
	$rootScope.userlogin = false;
	$rootScope.register = true;
	$rootScope.creatpwd = false;
	$rootScope.checkpwd = false;
	$scope.showclaim = false;
	$scope.savepwd = false;
	$rootScope.homedata = {};
	$scope.showprotocol = function(){
		$scope.showclaim = true;
		$rootScope.isBodyMask = true;
	}
	$scope.claimclose = function(){
		$scope.showclaim = false;
		$rootScope.isBodyMask = false;
	}

	$scope.languages = [
		{key: 'en-us', value: 'English'},
		{key: 'zh-cn', value: '中文简体'}
	];

	$scope.changeLanguage = function () {
		console.log($translate.proposedLanguage());
		if (!$scope.selectedLanguage) {
			var key = $translate.proposedLanguage();
			for (var i = 0; i < $scope.languages.length; ++i) {
				if ($scope.languages[i].key === key) {
					$scope.selectedLanguage = $scope.languages[i];
					break;
				}
			}
		}
		$translate.use($scope.selectedLanguage.key);
		$scope.languageIcon = '/assets/common/' + $scope.selectedLanguage.key + '.png';
	}
	$scope.changeLanguage();
	
	$scope.newuser = function () {
		$rootScope.register = false;
		$rootScope.creatpwd = true;
		$rootScope.checkpwd = false;
		var code = new Mnemonic(Mnemonic.Words.ENGLISH);
		$scope.newsecret = code.toString();
		newpublicKey = AcchainJS.crypto.getKeys($scope.newsecret).publicKey;
		$rootScope.newpublicKey = newpublicKey
	};

	// if(userService.setsecret){
	// 			$scope.secret =userService.setsecret;
	// } else {
	// 	$scope.secret = '';
	// }
	//默认保持登录
	$scope.saveLogin = true;
	//读取cookie
	// if(ipCookie('userSecret')){
	// 	if($scope.saveLogin){
	// 		$scope.secret =ipCookie('userSecret');
	// 	} else {
	// 		$scope.secret='';
	// 	}
	// };
	// 取消默认保持状态清楚cookie
	// $scope.saveLoginChange = function () {
	// 	$scope.saveLogin =!$scope.saveLogin;
	// 	//}
	// 	//console.log($scope.saveLogin)
	// 	if(!$scope.saveLogin){
	//
	// 		$scope.secret =ipCookie('userSecret');
	// 	}
	// 	else {
	//
	// 		$scope.secret =ipCookie('userSecret');
	// 	}
	// }
	$scope.backto = function () {
		$rootScope.register = true;
		$rootScope.creatpwd = false;
		$rootScope.checkpwd = false;
	};
	$scope.close = function () {
		$rootScope.register = true;
		$rootScope.creatpwd = false;
		$rootScope.checkpwd = false;
	}
	//确认
	$scope.lastcheck = function () {
		if ($scope.newsecret == $scope.lastsecret) {
			apiService.login({
				publicKey: newpublicKey
			}).success(function (res) {
				$rootScope.homedata = res;
				if (res.success == true) {
					userService.setData($scope.newsecret, res.account.address, newpublicKey, res.account.balance, res.account.secondPublicKey);
					// 是否登录的全局变量
					$rootScope.isLogin = true;
					$location.path('/home');
				}
			}).error(function (res) {
				toastError(res.error);
			});
		} else {
			toastError($translate.instant('ERR_PASSWORD_NOT_EQUAL'));
		}
	}
	$scope.saveTxt = function (filename) {
		$scope.savepwd = true;
		var text = $scope.newsecret.trim();
		//var address = AcchainJS.crypto.getAddress(newpublicKey);
		//txt = 'secret:' + '\r\n' + text + '\r\n\r\n' + 'address:' + '\r\n' + address + '\r\n';
		txt = 'secret:' + '\r\n' + text;
		var link = document.createElement("a");
		link.setAttribute("target", "_blank");
		if (Blob !== undefined) {
			var blob = new Blob([txt], { type: "text/plain" });
			link.setAttribute("href", URL.createObjectURL(blob));
		} else {
			link.setAttribute("href", "data:text/plain," + encodeURIComponent(txt));
		}
		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	// $scope.saveCookie = function () {
	// 	ipCookie('userSecret',$scope.secret);
	// 	//console.log(ipCookie('userSecret'));
	//}
	//登录
	$scope.registerin = function () {
		if (!$scope.secret) {
			toastError($translate.instant('ERR_INPUT_PASSWORD'));
			return;
		}
		if (!Mnemonic.isValid($scope.secret)) {
			return toastError($translate.instant('ERR_VIOLATE_BIP39'));
		}
		var publicKey = AcchainJS.crypto.getKeys($scope.secret).publicKey;
		$rootScope.publickey = publicKey;
		apiService.login({
			publicKey: publicKey
		}).success(function (res) {
			$rootScope.homedata = res;
			if (res.success == true) {
				userService.setData($scope.secret, res.account.address, publicKey, res.account.balance, res.account.secondPublicKey)
				// 是否登录的全局变量
				$rootScope.isLogin = true;
				$location.path('/home');
			} else {
				toastError($translate.instant('ERR_SERVER_ERROR'));
			}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		})
	}
	//下一步登录
	$scope.nextStep = function () {
		if($scope.savepwd){
			if($scope.readCheck){
				$rootScope.register = false;
				$rootScope.creatpwd = false;
				$rootScope.checkpwd = true;
			}else{
				return toastError($translate.instant('PLEASE_CONFIRM_READ'));
			}
		}else{
			return toastError($translate.instant('PLEASE_SAVE_PASSWORD'));
		}
		
	}
});
