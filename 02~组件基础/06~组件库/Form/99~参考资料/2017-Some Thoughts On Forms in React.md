# Some Thoughts On Forms in React

If you’re working on business to business applications, than you will quickly come across forms, many of them. They same goes when you’re building an App probably, where the user needs to interact. Now let’s set aside any UI or UX aspects and just think what is involved in a seemingly trivial task.

We might have a couple of fields, some select or checkboxes, a text area or two. Now we also might need to validate against the input and return meaningful messages. Everything doable actually. Ok, now maybe we want to validate as soon as a field is touched or when the user submits. We might also want to display all the error messages at once or one by one. What about dynamic fields, say, give the user the opportunity to add more than one address and what about deeply nested forms or data? You see where this going.

There are a number of viable approaches to solve aforementioned situations when it comes forms in React land. Without getting too specific, let’s just think about those approaches from a high level perspective.

## View Driven

Let’s call the first approach **\*React/JSX Driven\***, which is meant as tackling the problem via form elements. Building abstractions over elements like `form` or `input` for example.

```
<Input
  onChange={doSomething}
  label='Name Field'
  errorMessage={getSomeMessage()}
  {/*  */}
/>
```

Maybe managing the values via _Context_ or via _refs_ or other React specific ways, in some cases providing a `<Field /> `or `<Fieldset />` Component.

```
<Form onSubmit={doSomething} errors={getFormErrors()} >
  <Input onChange={doSomethingElse} />
  {/* ... */}
</Form>
```

The validation part is either shifted back to the developer or handled via attributes for example. These concepts work well for standardized solutions.

## **Model Driven**

On the other side of the spectrum, there is a model driven approach, which creates elements from a given set of data. In the most extreme form having knowledge of the data types, creating validators and specific inputs based on the field’s type. Again abstracting away the manual part of having to write the initial form and its corresponding elements and their attributes.

```
const schema = {
  name: type.string,
  customerId: optional(type.number)
}// ...<SpecialForm structure={schema} {/* ... */}/>
  {/* maybe add own elements too */}
</SpecialForm>
```

Which then renders the needed elements for the fields _name_ and _customerId_, providing labels or messages via an configuration object.

## A Mix of Model and View Driven

Another approach is to tackle the problem from both, the model and the view side. Using the model for the validation and abstracting over the regular form elements interconnected via _ContextType_ i.e.

## Redux / State Management Driven

Then of course there is always the possibility to use existing state management solutions like Redux and others to handle the form state. In the most simplest case using **\*react-redux\*** `connect` to add state management capabilities to a container containing the form.

## Back to square one: Some Background on Forms in React.

Before we continue, let’s take a step back and see what surprises most people when they start working with forms in React. A common question is: _How do we validate and update our form fields?_ To answer that question, we need to refer back to the [Uncontrolled Forms](https://facebook.github.io/react/docs/uncontrolled-components.html) and [Controlled Forms](https://facebook.github.io/react/docs/forms.html) sections in the React documentation. So, one can either access the form state via refs, in case of uncontrolled forms or use the value attribute and set the field values manually. With the latter being the recommended solution.

Ok, let’s build a form containing a couple of fields, just to get a sense of how this would be done in the real world. Before we start the initial iteration, let’s take a look at the actual form data:

```
type Data = {
  firstName: string,
  lastName: string,
  userName: string,
  confirmUserName: string,
  notifications: boolean,
}
```

So let’s see how the form would look like based on what we know:

```
// render function ...
<form onSubmit={handleSubmit}>
  <label>
    First Name:
    <input
      type="text"
      name="firstName"
      value={state.firstName}
      onChange={handleChange}
    />
  </label>
  <label>
    Last Name:
    <input
      type="text"
      name="lastName"
      value={state.lastName}
      onChange={handleChange}
    />
  </label>
  <label>
    User Name:
    <input
      type="text"
      name="userName"
      value={state.userName}
      onChange={handleChange}
    />
  </label>
  <label>
    Confirm User Name:
    <input
      type="text"
      name="confirmUserName"
      value={state.confirmUserName}
      onChange={handleChange}
    />
  </label>
  <label>
    Notifications:
    <input
      name="notifications"
      type="checkbox"
      checked={state.notifications}
      onChange={handleChange} />
  </label>
  <br />
  <label>
  <input type="submit" value="Submit" />
</form>
```

Now that we have the form setup sans the state handling capabilities, let’s implement `handleChange` to control the actual form state. Again, let’s follow the documentation and add the above functions just as described in the [documentation](https://facebook.github.io/react/docs/forms.html#handling-multiple-inputs).

```
handleChange(event) {
  const target = event.target;

  this.setState({
    [ target.name]: target.type === 'checkbox'
      ? target.checked
      : target.value
  });
}
```

Currently the form is uncontrolled per definition, so we still need to pass in an initial state, which could be done inside the constructor.

```
constructor(props) {
  super(props)
  this.state = {
    firstName: '',
    lastName: '',
    userName: '',
    confirmUserName: '',
    notifications: false
  }
}
```

So, this is it, we have a controlled form up and running. You can find the example [**here**](http://jsbin.com/fisecutojo/14/edit?js,console,output).

Now that we have the basics out the way, let’s focus on how to make our form management more efficient.

The state management can be extracted into a Higher Order Component. Leaving the actual visual representation to the wrapped component. Here’s a quick example sans any optimizations:

<iframe src="https://medium.com/media/67b17ab989c0614b984cb2659dd513cb" allowfullscreen="" frameborder="0" height="765" width="680" title="HigherOrderComponentValidateExample.js" class="ek n fc dx bg" scrolling="no" style="box-sizing: inherit; top: 0px; width: 680px; height: 765px; position: absolute; left: 0px;"></iframe>

We’re able to pass in the _Form_ via `enhancedForm(Form)` and use it like this:

```
<Form initialState={initialState} />
```

You can find the code [**here**](https://gist.github.com/busypeoples/6f2ead1dac8e47eb61b459eb8b24026f) and the example [**here**](http://jsbin.com/nuxadodigu/edit?js,console,output)**.**

## Back to the Efficiency Topic

As we have seen, creating the form structure is not the problem here, it even leaves us more room on deciding how these inputs can be styled, so we can see that the initial JSX or view code we need to write is maybe repetitive but nothing worth abstracting away and sacrificing flexibility for. Now we are free to choose a UI library to render our inputs or we can move these labels or error message anywhere we want to. This is not the real problem.

## Validation

Now if you recall, our form has no validation capabilities yet. So let’s see how we can approach the validation topic in a cautious manner, just because as opposed to state management, which can be solved with a single function, we need to think about how validation needs to happen from a user perspective. Does validation occur `onChange` or `onBlur` or `onKeyUp`? Or will the form values be validated when submitting the form?

We can identify two things here: the state is updated on every change when working with a controlled form, while the validation could happen at a different point in time. The following ideas I’m presenting are not new, I have previously written about these concepts [_here_](https://medium.com/javascript-inside/form-validation-as-a-higher-order-component-pt-1-83ac8fd6c1f0) and [_here_](https://medium.com/javascript-inside/form-validation-as-a-higher-order-component-pt-2-1edb7881870d#.t3xiogoe5).

The predicate functions are not Form specific, so writing something like this inside a `validate` function can be easily avoided.

```
const errors = {}if (this.state.street.length <= 3) {
  error.street = 'Street has min length of 4'
}
```

We can extract the validation from the form very easily by defining predicate functions that we apply with the provided input. So we can write a couple of predicate functions and compose them to bigger functions, each expecting and validating an input.

```
import {
  compose,
  curry,
  path,
  prop,
} from 'ramda'


// validations
const isNotEmpty = a => a.trim().length > 0const hasCapitalLetter = a => /[A-Z]/.test(a)const isGreaterThan = curry((len, a) => (a > len))const isLengthGreaterThan = len =>
  compose(isGreaterThan(len), prop('length'))
```

We can also resort to existing validation libraries and just add the missing validations for any specific cases we might need covered. This means we can easily run an array of predicates against an input and collect the error messages. For example [**Spected**](https://github.com/25th-floor/spected), a library I have written, does exactly this:

```
const validationRules = {
  name: [
    [ isGreaterThan(5),
      `Minimum Name length of 6 is required.`
    ],
  ],
  random: [
    [ isGreaterThan(7), 'Minimum Random length of 8 is required.' ],
    [ hasCapitalLetter,
      'Random should contain at least one uppercase letter.'
    ],
  ]
}
```

We’re defining `[predicateFunction, errorMsg]` for every input and then letting the predicates run against that input. Our previous validation can be rewritten to the following:

```
const spec = {
  street: [[isLengthGreaterThan(3), 'Street has min length of 4']]
}
```

And we can validate the input against that spec.

```
spected(spec, {street: 'foo'})
```

This is one possible way to decouple the _input_ from the _predicates_ and the _error messages_. There are other ways to validate and up to of the form library on how you want to achieve this. Taking the aforementioned route enables us to quickly compose small specs to bigger specs or change the error messages depending on the project.

## Connecting the Dots

So once we have a solution for validating the input independent from the form itself, we will want to connect the validation with the form.

Our Higher Order Component needs access to the validation `rules` . Expanding on the basics, let’s see how we can tackle all the different situations where a validation might occur, without locking the user from being able to define specific behaviours when needed.

We need to rethink our initial approach and enable user land to define and name specific functions as needed while keeping the state handling inside the higher order component.

What if we enable to override existing defaults when calling our form library? Enabling to define every single action upfront and then passing these functions to the wrapped component enables us to provide sane defaults that can be easily overridden.

```
const createForm = ({
  // define functions like onChange, validate etc.
}) => {
  // define and return class
}
```

Let’s implement a basic variant of that idea. All we want to do is update the state, when needed, at first.

```
const createForm = ({
  mapSetStateToProps = (updateState, actions) => ({
    onChange: e => {
      const { name, value } = getValueName(e)
      return updateState(actions.update(name, value))
    },
  }),
  actions = {
    update: (name, value, state) => {
      return [assocPath(['values', name], value, state)]
    },
  }
}) => Component => {}
```

Ok, so if you glance over the example, we can see that we defined a `mapSetStateToProps` function and an `actions` object. Like the name implies we are defining functions available to the wrapped component. By receiving an update function (think of an extended `setState`) and actions we are able to define specific functions and trigger actions corresponding to any events triggered inside the wrapped form. The actions handle common tasks like _update_ or _validate_. What actions do is calculate the new state and return a _next state_ and a _callback_ tuple. The callback can be fired when the setState callback is fired, useful when we want to do actions after the user has submitted any actions.

So any function defined in `mapSetStateToProps` takes care of calling the correct action and returning the results back to the passed in `updateState` function. Our actions only calculate the state. Separating the actual calculation from the specific action opens up a number of interesting opportunities as we will see.

But to get this refactored higher order component to work, we will need to find away on how to connect the mapStateToProps to the actual component.

```
const createForm = ({
  mapSetStateToProps,
  actions,
}) => Component => {
  return class HigherOrderFormComponent extends React.Component {
    constructor(props) {
      super(props)
      this.state = { values:props.values }
      this.actions = R.map(
        f => (...args) => f(...args, this.state),
        actions
      )
    }

    updateState = (setState) => {
      const [setStateFn, cb = () => {}] = setState
      this.setState(setStateFn, () => cb(this.state))
    }

    render() {
      const dispatchers =
        mapSetStateToProps(this.updateState, this.actions)
      return React.createElement(Component, {
        ...this.props,
        ...dispatchers,
        state: this.state.values,
      })
    }
  }
}
```

There is not really too much we need, to connect the actions with the actual component. Inside the constructor we map over the actions and wrap those inside another function which then passes in the actual arguments as well as the current state on to the action.

The `updateState` method destructs the passed in tuple to _nextState_ and _callback_ and then calls `setState` and passes in that defined _nextState_.

So we should have a running form again, what’s left is to pass in form values.

```
const enhanceForm = createForm({})
const EnhancedForm = enhanceForm(Form)

<EnhancedForm values={values} />
```

You can find a working example [**here**](http://jsbin.com/bebezizego/1/edit?html,js,output).

## Validation

Once we have validation rules defined, we can run these against the actual form state and keep track of any errors via local state, which we can pass down to the wrapped component again. But we know for a fact that the validation itself can be detached from the actual field value update, i.e. validating `oBlur`. Let’s see how this would work by writing some actual code.

First off we will add a new method `validate` to our existing `mapSetStateToProps` function as well as the corresponding `action` , which receives a name and a value and runs the validation against the corresponding spec for that given name.

If you recall we passed in the current state to the defined action functions. Let’s extend actions to also receive an object containing the component’s props as well as the defined _validate_ function. But where is the _validate_ function defined actually?

So, let’s extend the configuration object to also accept a `validate` property. Our `validate` is an object containing two functions, one for validating single fields, the other for validating all fields.

```
validateFns = {
  all: (data) =>
    spected(basicValidationRules, data),
  input: (name, value) =>
    spected(
      pick([name], basicValidationRules), {[name]: value}
    )
}
```

Now we can pass the specific validation via the _config_ object.

```
createForm({ validate: validateFns })
```

And the our higher order component might look like this now.

```
const createForm = ({
  validate,
  mapSetStateToProps = (updateState, actions) => ({
    // ...
    validate: e => {
      const { name, value } = getValueName(e)
      return updateState(actions.validate(name, value))
    },
    // ...
  }),
  actions: {
    validate: (name, value, state, {validate}) => {
      return [
        R.assoc('errors', validate.input(name, value), state)
      ]
    },
  }
}
```

The returned result for running the `validate` input function is an object consisting of the field name and an array of error messages in our case.

```
{ firstName: ['First Name is required'] } // in case of an error
{ firstName: [] } // in case of success
```

Then we merge the returned result with the current error state and update the actual state. So there is not too much involved in handling field validations on a form level. A second method `validateAll` as the name implies will validate all form values, i.e. when validating after submitting the form as opposed to dynamic `onChange` or `onBlur` validations.

```
validateAll: (cbFn, state, { validate }) => {
  return [
    assoc('errors', validate.all(state.values), state),
    (state) => {
      if (isValid(state.errors)) {
        cbFn(state.values)
      }
    }
  ]
}
```

You might have noticed that we’re returning a tuple this time. The nextState as well as a callback that should run when React’s `setState` has finished. The callback should fire when our form is valid and we want to call a passed in function that passes up the form values up the tree again.

Finally let’s add an `onSubmit` prop, so we can run the validations and pass up the values.

```js
mapSetStateToProps = (updateState, actions) => ({
  // ...
  onSubmit: (onsSubmitFn) => {
    return updateState(actions.validateAll(onsSubmitFn))
  }
}),
```

So what’s still missing? What about if we wanted to update the local field state and validate at the same time. The same principle applies we define the prop and a corresponding action. Here is the code for our implementation.

[HigherOrderComponentValidationExample.jsClone with Git or checkout with SVN using the repository's web address.gist.github.com](https://gist.github.com/busypeoples/ec79da7da72bc6cd6bc240810f54a511#file-higherordercomponentvalidationexample-js)

There are still a number of possible optimization regarding the current code, but it should give an overview of where this is heading. By doing the minimal work, of keeping state of values and errors, we open up the possibilities for user land to define the specific actions as needed.

You can also checkout the [**demo for our current example**](https://www.webpackbin.com/bins/-KoNgC1Hkd1AdDnZM0gG).

## What’s Next?

In part 2 we will focus on asynchronous actions, how to debounce and how to react to the current form state, i.e. switching to dynamic inline validation as soon as the form has been submitted for the very first time etc.
