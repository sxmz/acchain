/**
 * Created by zenking on 16/6/27.
 */
angular.module('acchain').filter('timestampFilter', function($filter) {
    return function (timestamp) {
        return AcchainJS.utils.format.fullTimestamp(timestamp);
    }
});
