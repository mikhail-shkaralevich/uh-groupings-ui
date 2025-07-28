/* global UHGroupingsApp */

(() => {
    /**
     * Service for data access of a logged-in user.
     * @name userService
     */
    UHGroupingsApp.service("userService", function ($q, groupingsService, $window) {

        const USER_STORAGE_KEY = 'currentUserDataSession';
        let currentUser = loadUserFromSessionStorage();
        let userPromise = null;

        function loadUserFromSessionStorage() {
            try {
                const userData = $window.sessionStorage.getItem(USER_STORAGE_KEY);
                return userData ? JSON.parse(userData) : null;
            } catch (e) {
                return null;
            }
        }

        function saveUserToSessionStorage(user) {
            try {
                $window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            } catch (e) {
                console.error("Error saving user to sessionStorage: ", e);
            }
        }

        return {
            /**
             * Fetches and returns the current user.
             * Tries sessionStorage first, then makes API call and caches.
             * @return {*|Promise} A promise that resolves with current user object.
             */
            getCurrentUser() {
                if (currentUser) {
                    return $q.when(currentUser);
                }
                if (userPromise) {
                    // if a request is already in progress, return the existing promise
                    return userPromise;
                }

                // No user loaded and no request in progress, make the API call
                let deferred = $q.defer(); // Create a deferred object to turn the callback into a promise.
                userPromise = deferred.promise;

                groupingsService.getCurrentUser((res) => {
                    currentUser = {
                        uid: res.data.uid,
                        uhUuid: res.data.uhUuid
                    };
                    saveUserToSessionStorage(currentUser);
                    deferred.resolve(currentUser); // resolve the promise with the data.
                    userPromise = null;
                });

                return userPromise;
            },

            /**
             * Returns logged-in user's UID.
             * @return {String} UID.
             */
            getUid() {
                return currentUser.uid;
            },
        };
    });
})();
