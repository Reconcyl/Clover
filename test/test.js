import parse from '../src/index.js';
import { commands } from '../src/commands.js';
import colors from 'picocolors';
import Tentamen from 'tentamen';

const tentamen = new Tentamen({});
tentamen.fn = () => parse(tentamen.input, { silent: true });

const uncovered = Object.keys(commands)
  .filter(key => commands[key].constructor.name === 'Verb');

// hijack tentamen's methods to add coverage information
tentamen.add = (function () {
  const cached = tentamen.add;
  return function () {
    cached.apply(this, arguments); // run the test
    const title = arguments[0];
    // find the index of an uncovered command...
    const index = uncovered
      // whose name is at the beginning of the current test...
      .findIndex(name => title.startsWith(name));
    // and remove it from the uncovered commands
    if (index > -1) {
      uncovered.splice(index, 1);
    }
  };
})();
tentamen.done = (function () {
  const cached = tentamen.done;
  return function () {
    cached.apply(this, arguments); // output pass/fail count
    const numCommands = Object.keys(commands).length;
    // percentage of commands which were found to be covered
    const p = (100 * ((numCommands - uncovered.length) / numCommands))
      .toFixed(2);
    if (uncovered.length === 0) {
      console.log(colors.green('  o  ') + `${p}% command coverage`);
    } else {
      console.log(
        colors.red('  X  ') +
        colors.yellow(`${p}% command coverage (${uncovered.length} commands untested)`)
      );
      console.log(`     (${uncovered.join(', ')})`);
    }
  };
})();

/**
 * tests below
 */

tentamen.suite('tests');
tentamen.add('add', 'focus 5\nadd 5', 10);
tentamen.add(
  'count',
  `focus 'aaaaa'
  count 'a'`,
  5
);
tentamen.add('divide', 'focus 5\ndivide by 5', 1);
tentamen.add('focus', 'focus 5', 5);
tentamen.add(
  'group',
  `focus [1 2 3 4 5 6 7]
  groups of 2`,
  [[1, 2], [3, 4], [5, 6], [7]]
);
tentamen.add('multiply', 'focus 5\nmultiply by 5', 25);
tentamen.add(
  'product',
  `focus [1 2 3 4 5 6 7 8 9 10]
  product`,
  3628800
);
tentamen.add(
  'set',
  `set :mut to 5
  focus :mut`,
  5
);
tentamen.add(
  'show',
  `focus 5
  show`,
  [5, 5] // implicit
);
tentamen.add(
  'showMonadic',
  `focus 5
  show 'a'`,
  ['a', 5] // implicit
);
tentamen.add(
  'split',
  `focus '1\\n2\\n3\\n4'
  split on newlines`,
  ['1', '2', '3', '4']
);
tentamen.add('subtract', 'focus 5\nsubtract 5', 0);
tentamen.add(
  'sum',
  `focus [1 2 3 4 5 6 7 8 9 10]
  sum`,
  55
);

tentamen.done();
