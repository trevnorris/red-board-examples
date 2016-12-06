'use strict';

const five = require('johnny-five');
const board = new five.Board();
const print = process._rawDebug;

board.on('ready', function() {
  var abToggle = true;
  var boxesJumped = 0;
  var boxes = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var jumpNext = false;
  var justJumped = false;
  var firstClick = true;

  const button = new five.Button(3);

  button.on('down', function() {
    if (firstClick) return firstClick = false;
    jumpNext = true;
  });

  const lcd = new five.LCD({
    // LCD pin name  [RS, EN, DB4, DB5, DB6, DB7]
    pins: [7, 8, 9, 10, 11, 12],
  });

  lcd.clear().home();

  lcd.createChar('jumper', [6, 6, 21, 14, 4, 7, 24, 0]);

  lcd.useChar('jumper');
  lcd.useChar('runninga');
  lcd.useChar('runningb');
  lcd.useChar('box15');

  (function runner() {
    var i;

    // Clear out existing boxes.
    for (i = 0; i < boxes.length; i++) {
      if (boxes[i] === 1)
        lcd.cursor(1, i).print(' ');
    }

    // Randomly add a box to the end of the stack. Make sure they're
    // at least 2 apart.
    if (Math.random() > 0.5 && boxes[15] === 0)
      boxes.push(1);
    else
      boxes.push(0);

    boxesJumped += boxes.shift();

    // Print the box on each location.
    for (i = 0; i < boxes.length; i++) {
      if (boxes[i] === 1)
        lcd.cursor(1, i).print(':box15:');
    }

    if (jumpNext && !justJumped) {
      lcd.cursor(1, 0).print(' ');
      lcd.cursor(0, 0).print(':jumper:');
      jumpNext = false;
      justJumped = true;
    } else if (boxes[0] === 1) {
      // We failed....
      printEnd(runner);
      return;
    } else {
      lcd.cursor(0, 0).print(' ');
      lcd.cursor(1, 0).print(':running' + (abToggle ? 'a' : 'b') + ':');
      abToggle = !abToggle;
      justJumped = false;
    }

    var timeout = 750 - boxesJumped * 12;
    if (timeout < 250) timeout = 250;
    setTimeout(runner, timeout);
  }());


  function printEnd(runner) {
    for (var i = 0; i < 16; i++) (function(i) {
      setTimeout(function() {
        lcd.cursor(0, i).print('x');
        lcd.cursor(1, i).print('x');
      }, i * 75);
    }(i));

    setTimeout(function() {
      lcd.clear().home();
      lcd.cursor(0, 0).print('Boxes jumped:');
      lcd.cursor(1, 0).print('  ' + boxesJumped);
      button.once('down', () => {
        lcd.clear().home();
        for (var i = 0; i < boxes.length; i++)
          boxes[i] = 0;
        jumpNext = false;
        setImmediate(runner);
      });
    }, 2000);
  }

  this.repl.inject({
    lcd: lcd,
    button: button
  });
});
