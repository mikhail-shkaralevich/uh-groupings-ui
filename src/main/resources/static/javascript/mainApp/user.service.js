/* global UHGroupingsApp */

(() => {
    UHGroupingsApp.service("userService", function (groupingsService) {

        var currentUser = null;
        var feedbackEmail = null;
        var userPromise = null;

        return {
            getCurrentUser() {
                if (currentUser) {
                    // if user data is already loaded, return it immediately as a resolved promise
                    return $q.when(currentUser);
                }
                if (userPromise) {
                    // if a request is already in progress, return the existing promise
                    return userPromise;
                }

                // No user loaded and no request in progress, make the API call
                var deferred = $q.defer(); // Create a deferred object to turn the callback into a promise.
                userPromise = deferred.promise;

                groupingsService.getCurrentUser((res) => {
                    currentUser = {
                        uid: res.data.uid,
                        uhUuid: res.data.uhUuid
                    };
                    deferred.resolve(currentUser); // resolve the promise with the data.
                    userPromise = null;
                });

                return userPromise;
            },

            clearUser() {
                currentUser = null;
                userPromise = null;
            },
        };
    });
})();
