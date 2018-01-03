import find from 'domassist';

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

export default Do;
