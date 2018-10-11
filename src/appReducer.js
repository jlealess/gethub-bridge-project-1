import { accessToken } from './setup/keys';

const INITIAL_APP_STATE = {
    username: "",
    profile: {},
    followers: [],
    events: [],
    loggedIn: false,
    loginErrorMessage: "",
    filters: {
        ForkEvent: true,
        PullRequestEvent: true,
    }
}

const APP_ACTIONS = {
    FETCH_FOLLOWERS: "app/FETCH_FOLLOWERS",
    SET_LOGIN_ERROR: "app/SET_LOGIN_ERROR",
    SET_USERNAME: "app/SET_USERNAME",
    SET_EVENTS: "app/SET_EVENTS",
    TOGGLE_FORK_EVENTS: "app/TOGGLE_FORK_EVENTS",
    TOGGLE_PULL_REQUEST_EVENTS: "app/TOGGLE_PULL_REQUEST_EVENTS",
    USER_LOGIN: "app/USER_LOGIN",
    USER_LOGOUT: "app/USER_LOGOUT"
};

const getGithubUser = username => {
    return fetch(`https://api.github.com/users/${username}${accessToken}`);
}

const handleLoginError = () => ({
  type: APP_ACTIONS.SET_LOGIN_ERROR,
  payload: "Please enter a GitHub username"
});

const saveFollowers = followers => ({
  type: APP_ACTIONS.FETCH_FOLLOWERS,
  payload: followers
});

const setUserInLocalStorage = username => {
    localStorage.setItem("ghDevUsername", username);
    localStorage.setItem("ghDevLoggedIn", true);
}

export const fetchEvents = eventsUrl => dispatch => {
    return fetch(eventsUrl)
        .then(res => res.json())
          .then(events => {
            return events.filter(
              event => event.type === "ForkEvent" || event.type === "PullRequestEvent"
            )
          }).then(data => {
            const events = data.map(event => {
              if (event.type === "PullRequestEvent") {
                return fetch(event.payload.pull_request.url)
                .then(res => res.json())
                .then(data =>  ({...event, status: data.state, title: data.title}))
              } else {
                return event
              }
            });
            Promise.all([...events]).then(events => dispatch(handleSetEvents(events)));
          })
};

export const fetchFollowers = followersUrl => dispatch => {
  return fetch(`${followersUrl}${accessToken}`)
    .then(res => res.json())
    .then(followers => dispatch(saveFollowers(followers)));
};

export const handleChangeUsername = e => ({
    type: APP_ACTIONS.SET_USERNAME,
    payload: e.target.value,
});

export const handleLogin = profile => ({
    type: APP_ACTIONS.USER_LOGIN,
    payload: profile
});

export const handleLogout = () => {
    localStorage.setItem("ghDevLoggedIn", false);
    return {
        type: APP_ACTIONS.USER_LOGOUT
    }
};

export const handleSetEvents = events => ({
    type: APP_ACTIONS.SET_EVENTS,
    payload: events
});

export const loginUser = username => dispatch => {
  if (!localStorage.getItem("ghDevUsername")) {
    setUserInLocalStorage(username);
  }
  if (username) {
      return getGithubUser(username)
        .then(res => res.json())
        .then(profile => dispatch(handleLogin(profile)));
  } else {
      dispatch(handleLoginError());
  }
};

export const setUserFromLocalStorage = username => ({
    type: APP_ACTIONS.SET_USERNAME,
    payload: username,
});

export const toggleForkEventsFilter = () => ({
  type: APP_ACTIONS.TOGGLE_FORK_EVENTS
});

export const togglePullRequestEventsFilter = () => ({
    type: APP_ACTIONS.TOGGLE_PULL_REQUEST_EVENTS
});

export const appReducer = (state = INITIAL_APP_STATE, action) => {
    switch(action.type) {
        case APP_ACTIONS.FETCH_FOLLOWERS: {
            return {
                ...state,
                followers: action.payload
            }
        }
        case APP_ACTIONS.SET_EVENTS: {
            return {
                ...state,
                events: action.payload
            }
        }
        case APP_ACTIONS.SET_LOGIN_ERROR: {
            return {
                ...state,
                loginErrorMessage: action.payload,
            }
        }
        case APP_ACTIONS.SET_USERNAME: {
            return {
                ...state,
                loginErrorMessage: "",
                username: action.payload,
            }
        }
        case APP_ACTIONS.TOGGLE_FORK_EVENTS: {
            return {
                ...state,
                filters: {...state.filters, ForkEvent: !state.filters.ForkEvent }
            }
        }
        case APP_ACTIONS.TOGGLE_PULL_REQUEST_EVENTS: {
            return {
                ...state,
                filters: { ...state.filters, PullRequestEvent: !state.filters.PullRequestEvent }
            }
        }
        case APP_ACTIONS.USER_LOGIN: {
            return {
                ...state,
                loggedIn: true,
                loginErrorMessage: "",
                profile: action.payload
            }
        }
        case APP_ACTIONS.USER_LOGOUT: {
            return {
                ...state,
                profile: {},
                loggedIn: false
            }
        }
        default: {
            return state;
        }
    }
} 