import React from 'react';
import { BrowserRouter as Router, Route, Link, withRouter } from 'react-router-dom';

const SubHome = (props) => (
  <div>
    <h2>Sub Home:{props.location.pathname}</h2>
  </div>
);

const SubHomeWithRouter = withRouter(SubHome);

const Home = () => (
  <div>
    <h2>Home</h2>
    <SubHomeWithRouter/>
  </div>
);

const About = () => (
  <div>
    <h2>About</h2>
  </div>
);

const Topics = ({match, push}) => (
  <div>
    <h2>Topics</h2>
    <ul>
      <li><Link to={`${match.url}/rendering`}>Rendering with React</Link></li>
      <li><Link to={`${match.url}/components`}>Components</Link></li>
      <li><Link to={`${match.url}/props-v-state`}>Props v. State</Link></li>
    </ul>

    <Route path={`${match.url}/:topicId`} component={Topic}/>
    <Route exact path={match.url} render={() => (
      <h3>
        Please select a topic.
        <button onClick={() => {
          push('/');
        }}>
          返回首页
        </button>
      </h3>
    )}/>
  </div>
);

const Topic = ({match}) => (
  <div>
    <h3>{match.params.topicId}</h3>
  </div>
);

const BasicExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/topics">Topics</Link></li>
      </ul>

      <hr/>

      <Route exact path="/" component={Home}/>
      <Route path="/about" component={About}/>
      <Route path="/topics" component={Topics}/>
    </div>
  </Router>
);

export default BasicExample;