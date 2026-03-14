export const TEST_PASSWORD = "1234567890";
export const TEST_JWT_SECRET = "test-secret-only-for-automated-tests";

// Auth tests
export const AUTH_USER = {
  email: "auth_test_user@example.com",
  username: "auth_test_user",
};

export const MISSING_EMAIL = "missing@example.com";
export const WRONG_PASSWORD = "wrong-password";
export const NOT_REGISTERED_EMAIL = "not_registered@example.com";
export const INVALID_REFRESH_TOKEN = "invalid-refresh-token";
export const MALFORMED_TOKEN = "not-a-jwt";
export const INVALID_MONGO_URI = "mongodb://invalid-host-that-does-not-exist:27017/test";

export const REGISTRATION_IMG_URL_CASE = {
  email: "imgurl@example.com",
  username: "imgurl_user",
  imgUrl: "https://example.com/avatar.png",
};

export const REGISTRATION_ERROR_USER = {
  email: "err500_register@example.com",
  username: "err500_register",
};

export const DB_CREATE_FAILURE_MSG = "DB create failure";
export const DB_LOGOUT_FAILURE_MSG = "DB logout failure";
export const DB_REFRESH_FAILURE_MSG = "DB refresh failure";
export const UNKNOWN_ERROR = "not an Error instance";
export const UNKNOWN_ERROR_MSG = "An unknown error occurred";

export const GHOST_USER = {
  email: "ghost@example.com",
  username: "ghost",
};

export const GHOST_REFRESH_USER = {
  email: "ghost_refresh@example.com",
  username: "ghost_refresh",
};

// Post tests
export const POST_OWNER_USER = {
  email: "post_owner@example.com",
  username: "post_owner",
};

export const POST_FOLLOWER_USER = {
  email: "post_follower@example.com",
  username: "post_follower",
};

export const POST_NO_AUTH_TITLE = "no auth";

export const OWNER_POST_DATA = {
  title: "My first post",
  content: "hello",
  imgUrl: "img.png",
};

export const UPDATED_POST_TITLE = "Updated title";

export const FEED_NOT_FOUND_USER = {
  email: "feed_not_found@example.com",
  username: "feed_not_found",
};

export const MALFORMED_ID = "123";

// Comment tests
export const COMMENT_USER = {
  email: "comment_user@example.com",
  username: "comment_user",
};

export const COMMENT_POST_DATA = {
  title: "post for comments",
  content: "test",
};

export const COMMENT_NO_AUTH_CONTENT = "no auth";
export const FIRST_COMMENT_CONTENT = "first comment";
export const UPDATED_COMMENT_CONTENT = "updated comment";

// User tests
export const USER_A_CONF = {
  email: "user_a@example.com",
  username: "user_a",
};

export const USER_B_CONF = {
  email: "user_b@example.com",
  username: "user_b",
};

export const UPDATED_USER_A = {
  username: "user_a_new",
  imgUrl: "avatar.png",
};

export const USER_B_POST_DATA = {
  title: "userB post",
  content: "to be deleted",
};

export const SEARCH_QUERY = "user_";
export const UPDATE_USERNAME_NOAUTH = "noauth";
export const UPDATE_USERNAME_HACKED = "hacked";

export const COMMENT_OTHER_USER = {
  email: "comment_other@example.com",
  username: "comment_other",
};

export const COMMENT_OTHER_DELETE_USER = {
  email: "comment_other_delete@example.com",
  username: "comment_other_delete",
};

export const MALFORMED_POST_ID = "not-a-valid-id";

// Google Auth tests
export const GOOGLE_NEW_USER = {
  email: "google-test@example.com",
  name: "Google User",
  picture: "http://image.com/pic.jpg",
  sub: "12345",
};

export const GOOGLE_EXISTING_USER = {
  email: "google-test@example.com",
  name: "Google User Updated",
  picture: "http://image.com/pic-updated.jpg",
  sub: "12345",
};

export const GOOGLE_NO_EMAIL_USER = {
  name: "No Email User",
  sub: "99999",
};

