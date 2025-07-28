/* global _, angular, UHGroupingsApp */

(() => {

    /**
     * This controller contains functions specific to the home page.
     * @param $scope - binding between controller and HTML page
     * @param $controller - service for instantiating controllers
     * @param groupingsService - service for creating requests to the groupings API
     * @param userService - service for management of a logged-in user.
     * @param Message - display messages
     */
    function HomeJsController($scope, $controller, groupingsService, userService, Message) {

        angular.extend(this, $controller('GeneralJsController', {$scope}));

        $scope.init = () => {

            /**
             * Get the uid of the current user, set the uid to the scope in general controller
             */
            userService.getCurrentUser().then((res) => {
                $scope.currentUser = res;
            });

            /**
             * Get the number of memberships that the current user is associated with.
             */
            groupingsService.getNumberOfMemberships((res) => {
                    $scope.numberOfMemberships = res;
                }
            );

            /**
             * Get the number of groupings that the current user is associated with.
             */
            groupingsService.getNumberOfGroupings((res) => {
                    $scope.numberOfGroupings = res;
                }
            );
        };
    }

    UHGroupingsApp.controller("HomeJsController", HomeJsController);
})();
