import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { Provider } from 'react-redux'
import jwt_decode from 'jwt-decode'

import store from './store'

import PrivateRoute from './components/common/PrivateRoute'

import Navbar from './components/layout/Navbar'
import Landing from './components/layout/Landing'
import Footer from './components/layout/Footer'

import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import CreateProfile from './components/create-profile/CreateProfile'
import EditProfile from './components/edit-profile/EditProfile'
import AddExperience from './components/add-credentials/AddExperience'

import './App.css';
import setAuthToken from './utils/setAuthToken';
import { setCurrentUser, logoutUser } from './actions/authActions';
import { clearCurrentProfile } from './actions/profileActions';

// Check for token
if (localStorage.jwtToken) {
  // Set auth token header
  setAuthToken(localStorage.jwtToken)
  // Decode token to get user info and expiry
  const decoded = jwt_decode(localStorage.jwtToken)
  // Store user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));

  // Check for expired token
  const currentTime = Date.now() / 1000
  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser())
    // Clear current profile
    store.dispatch(clearCurrentProfile())

    // Redirect to login
    window.location.href = '/login'
  }
}

class App extends Component {
  render() {
    return (
      <Provider store={ store }>
        <Router>
          <div className="App">
            <Navbar />
            <Route exact path="/" component={ Landing } />
            <div className="container">
              <Route exact path="/register" component={ Register } />
              <Route exact path="/login" component={ Login } />
              <Switch>
                <PrivateRoute exact path="/dashboard" component={ Dashboard } />
              </Switch>
              <Switch>
                <PrivateRoute exact path="/create-profile" component={ CreateProfile } />
              </Switch>
              <Switch>
                <PrivateRoute exact path="/edit-profile" component={ EditProfile } />
              </Switch>
              <Switch>
                <PrivateRoute exact path="/add-experience" component={ AddExperience } />
              </Switch>
            </div>
            <Footer />
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
