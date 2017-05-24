angular.module('asch').run(function ($rootScope, $location, ipCookie, apiService, $window, userService) {
    $rootScope.isBodyMask = false;
    $rootScope.userlogin = false;
    $rootScope.checkobj = {};
    $rootScope.coedobj = {};
    $rootScope.$on('$routeChangeStart', function (r, n, x) {
        if (!userService.secret && window.sessionStorage && window.sessionStorage.getItem('secret')) {
            userService.setData(
                window.sessionStorage.getItem('secret'),
                window.sessionStorage.getItem('address'),
                window.sessionStorage.getItem('publicKey'),
                window.sessionStorage.getItem('balance'),
                window.sessionStorage.getItem('secondPublicKey')
            )
        }
        if (!userService.secret) {
            $location.path('/login');
        }else{
        	apiService.account({
				address: userService.address
			}).success(function (res) {
				if (res.success == true) {
					userService.update(res.account);
				};
			}).error(function (res) {
				toastError(res.error);
			});
        }
    });
});
