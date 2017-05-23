angular.module('asch').controller('applicationCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $window, NgTableParams, userService, $translate) {
	$rootScope.active = 'application';
	$rootScope.userlogin = true;
	$scope.newapplication = true;
	$scope.installed = false;

	$scope.newapplicationchange = function () {
		$scope.newapplication = true;
		$scope.installed = false;
		$scope.applist = new NgTableParams({
			page: 1,
			count: 20,
			sorting: {
				height: 'desc'
			}
		}, {
				total: 0,
				counts: [],
				getData: function ($defer, params) {
					apiService.appList({
						limit: params.count(),
						offset: (params.page() - 1) * params.count()
					}).success(function (res) {

						params.total(res.count);
						$defer.resolve(res.dapps);
					}).error(function (res) {
						toastError($translate.instant('ERR_SERVER_ERROR'));
					});
				}
			});
	}
	$scope.newapplicationchange();
	$scope.installedchange = function () {
		$scope.newapplication = false;
		$scope.installed = true;

		$scope.appinstalled = new NgTableParams({
			page: 1,
			count: 20,
		}, {
				total: 0,
				counts: [],
				getData: function ($defer) {
					apiService.appInstalled({
					}).success(function (res) {
						$defer.resolve(res.dapps);
					}).error(function (res) {
						toastError($translate.instant('ERR_SERVER_ERROR'));
					});
				}
			});
	};

});
