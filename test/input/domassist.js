import Domodule from 'domodule';
import { find, fire, on } from 'domassist';

class Reload extends Domodule {
  postInit() {
    on(this.el, 'click', this.onClick.bind(this));
  }

  onClick(event) {
    event.preventDefault();
    fire(this.el, 'tessst', { bubbles: true });
  }
}

Domodule.register('Reload', Reload);

class Test {
  constructor() {
    console.log('test');
  }

  type() {
    console.log(typeof find);
  }
}

class Do extends Test {
  constructor() {
    super();

    this.echo();
  }

  echo(message = 'something') {
    console.log(message);
  }
}

const matrix = ['a', 'b', 'c'];
const [first] = matrix;
const obj = { first };
const f = () => obj;

function foo(...args) {
  const { a } = f();
  console.log(args);

  return a;
}

console.log(foo(matrix, Test));

export default Do;
