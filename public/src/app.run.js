angular.module('acchain').run(function ($rootScope, $location, ipCookie, apiService, $window, userService) {
    $rootScope.isBodyMask = false;
    $rootScope.userlogin = false;
    $rootScope.checkobj = {};
    $rootScope.coedobj = {};
    $rootScope.$on('$routeChangeStart', function (r, n, x) {
        if (!userService.secret && window.localStorage && window.localStorage.getItem('secret')) {
            userService.setData(
                window.localStorage.getItem('secret'),
                window.localStorage.getItem('address'),
                window.localStorage.getItem('publicKey'),
                window.localStorage.getItem('balance'),
                window.localStorage.getItem('secondPublicKey')
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
