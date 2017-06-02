angular.module('asch').filter('typeFilter', function ($filter) {
    const TYPE_LABEL = [
        'TRS_TYPE_TRANSFER',
        'TRS_TYPE_SECOND_PASSWORD',
        'TRS_TYPE_DELEGATE',
        'TRS_TYPE_VOTE',
        'TRS_TYPE_MULTISIGNATURE',
        'TRS_TYPE_DAPP',
        'TRS_TYPE_DEPOSIT',
        'TRS_TYPE_WITHDRAWAL',
        'TRS_TYPE_APPROVAL',
        'TRS_TYPE_UIA_ISSUER',
        'TRS_TYPE_UIA_ASSET',
        'TRS_TYPE_UIA_ISSUE',
        'TRS_TYPE_UIA_EXERCISE'
    ]
    return function (value) {
        return $filter('translate')(TYPE_LABEL[value]);
    }
});
