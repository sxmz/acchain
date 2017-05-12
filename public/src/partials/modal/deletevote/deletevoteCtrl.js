angular.module('asch').controller('deletevoteCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $http, userService, postSerivice, $translate) {

    $rootScope.deletevotetoinfo = false;
    $scope.userService = userService;
    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.deletevotetoinfo = false;
    };

    $scope.checkvoteto = function (params) {
        var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$/;
        if (userService.secondPublicKey && !reg.test($scope.secondpassword)) {
            toastError($translate.instant('ERR_SECOND_PASSWORD_FORMAT'));
            return;
        }
        var transaction = AschJS.vote.createVote($rootScope.deletevoteContent, userService.secret, $scope.secondpassword)
        postSerivice.post(transaction).success(function (res) {
            if (res.success == true) {
                $rootScope.coedobj = {}
                $rootScope.checkobj = {}
                // console.log($rootScope.checkobj);
                $scope.Close();
                $rootScope.$emit('downvoteSuccess');
                toast($translate.instant('INF_DELETE_SUCCESS'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    };
});
