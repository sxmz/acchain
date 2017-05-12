angular.module('asch').controller('votetoCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $http, userService, postSerivice, $translate) {

    $rootScope.votetoinfo = false;

    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.votetoinfo = false;
    };
    $scope.userService = userService;
    $scope.checkvoteto = function () {
        var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$/;
        if (userService.secondPublicKey && !reg.test($scope.secondpassword)) {
            toastError($translate.instant('ERR_SECOND_PASSWORD_FORMAT'));
            return;
        }
        var transaction = AschJS.vote.createVote($rootScope.voteContent, userService.secret, $scope.secondpassword);
        postSerivice.post(transaction).success(function (res) {
            if (res.success == true) {
                $rootScope.checkobj = {}
                $rootScope.coedobj = {}
                console.log($rootScope.checkobj);
                $scope.Close();
                $rootScope.$emit('upvoteSuccess');
                toast($translate.instant('INF_VOTE_SUCCESS'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    };
});
