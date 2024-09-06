const robot = require('robotjs');

function jiggleMouse() {
    const seconds = 1;
    let mouse = robot.getMousePos();

    let newX = mouse.x + 5;
    let newY = mouse.y + 5;

    robot.moveMouse(newX, newY);

    setTimeout(() => {
        robot.moveMouse(mouse.x, mouse.y);

        setTimeout(jiggleMouse, seconds * 1000);
    }, seconds * 1000);
}

jiggleMouse();
