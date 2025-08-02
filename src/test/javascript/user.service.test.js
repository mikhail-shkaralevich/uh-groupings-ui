/* global inject */

describe("UserService", function () {

    beforeEach(module("UHGroupingsApp"));

    let userService;
    let groupingsService;
    let $q;
    let $rootScope;
    let $window;

    const mockUser = {
        uid: 'testiwta',
        uhUuid: '99997010'
    }

    beforeEach(inject((_groupingsService_) => {
        groupingsService = _groupingsService_;

        spyOn(groupingsService, 'getCurrentUser').and.callFake((onSuccess) => {
            onSuccess(mockUser);
        });
    }));

    beforeEach(inject((_userService_, _$q_, _$rootScope_, $_window_) => {
        userService = _userService_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $window = $_window_;

        $window.sessionStorage.removeItem('currentUserDataSession');
    }));

    describe('getCurrentUser()', () => {

        it('should be defined', () => {
            expect(userService.getCurrentUser).toBeDefined()
        });

        describe('when no user is cached in memory or session storage', () => {
            it('should call groupingsService.getCurrentUser', () => {
                userService.getCurrentUser();
                expect(groupingsService.getCurrentUser).toHaveBeenCalled();
            });

            it('should return a promise that resolves with the user data from the API', (done) => {
                let resolvedUser = null;
                userService.getCurrentUser().then(user => {
                    resolvedUser = user;
                });
                $rootScope.$apply(); // issues digest cycle which resolves the promise.
                expect(resolvedUser).toEqual(mockUser);
                done();
            });

            it('should save the fetched user to session storage', () => {
                // Ensure the session storage is empty
                expect($window.sessionStorage.getItem('currentUserDataSession')).toBeNull();

                userService.getCurrentUser();
                $rootScope.$apply(); // Resolve the promise

                let storedUser = $window.sessionStorage.getItem('currentUserDataSession');
                expect(storedUser).toBeDefined();
                expect(JSON.parse(storedUser)).toEqual(mockUser);
            });

            it('should only call API once for concurrent requests', () => {
                let promise1 = userService.getCurrentUser();
                let promise2 = userService.getCurrentUser();

                expect(groupingsService.getCurrentUser.calls.count()).toBe(1);

                let user1 = null;
                let user2 = null;
                promise1.then((res) => { user1 = res });
                promise2.then((res) => { user2 = res });

                $rootScope.$apply(); // resolve the promise

                expect(user1).toEqual(mockUser);
                expect(user2).toEqual(mockUser);
            });
        });

        describe('when a user is a already in memory', () => {
            beforeEach(() => {
                // preload a user
                userService.getCurrentUser();
                $rootScope.$apply();

                // reset the spy to ensure that we are only tracking new calls in the tests.
                groupingsService.getCurrentUser.calls.reset();
            });

            it('should not call groupingsService.getCurrentUser', () => {
                userService.getCurrentUser();
                expect(groupingsService.getCurrentUser).not.toHaveBeenCalled();
            });

            it('should return an immediately resolved promise with the cached user', (done) => {
                let resolvedUser = null;

                // This should resolve synchronously because the user is already in memory
                userService.getCurrentUser().then((res) => {
                    resolvedUser = res;
                });

                // Unnecessary since the promise is already resolved but still a good practice.
                $rootScope.$apply();

                expect(resolvedUser).toEqual(mockUser);
                done();
            });
        });

        describe('when a user is in session storage but not in memory', () => {
            let userServiceInstance;

            // Re-instantiate the service after populating sessionStorage
            // to simulate a page refresh scenario.
            beforeEach(inject(($injector) => {
                $window.sessionStorage.setItem('currentUserDataSession', JSON.stringify(mockUser));

                // Get a new instance of the service.
                userServiceInstance = $injector.get('userService');

                // Reset the spy after setup
                groupingsService.getCurrentUser.calls.reset();
            }));

            it('should load the user from session storage and not call the API', (done) => {
                let resolvedUser = null;
                userServiceInstance.getCurrentUser().then((res) => {
                    resolvedUser = res;
                });

                $rootScope.$apply();

                expect(groupingsService.getCurrentUser).not.toHaveBeenCalled();

                expect(resolvedUser).toEqual(mockUser);
                done();
            });
        })
    });
});