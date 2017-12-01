const Container = PIXI.Container;
const autoDetectRenderer = PIXI.autoDetectRenderer;
const loader = PIXI.loader;
const TextureCache = PIXI.utils.TextureCache;
const resources = PIXI.loader.resources;
const Sprite = PIXI.Sprite;
const Text = PIXI.Text;
const Rectangle = PIXI.Rectangle;

const type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

//Create the renderer
const renderer = autoDetectRenderer(800, 600);
//Create a container object called the `stage`
const stage = new Container();
//Add the canvas to the HTML document
document.body.appendChild(renderer.view);

//counts up every step
let clock = 0;
let dinnyJump = 0;
let stopGame = false;
let disableFastDrop = true;

//TODO: fix stupid issue with the game freezing partially when leaving a tab
//TODO: PhysicsManager can be generalized to UpdateManager. just run everything there every tick

loader
    .add('./assets/radiatorjoe48_1.png')
    .add('./assets/radiatorjoe48_2.png')
    .add('./assets/platform.png')
    .add('./assets/background.png')
    .add('./assets/black.png')
    .load(setup)

function setup () {
    //SPRITE SETUP
    //add dinny
    const dinnySpr = createSprite([
        './assets/radiatorjoe48_1.png',
        './assets/radiatorjoe48_2.png',
    ]);
    //anchors mess with the collision rectangles!
    //dinnySpr.anchor.x = .5;
    //dinnySpr.anchor.y = .5;
    dinnySpr.x = 100;
    dinnySpr.y = 200;
    dinnySpr.animationSpeed = 0.2;
    dinnySpr.play();

    //add initial platform
    const platform = createSprite('./assets/platform.png');
    platform.width = renderer.view.width;
    platform.x = 0;
    platform.y = 300;

    //add wall that destroys platforms to prevent memory leaks
    const wall = createSprite('./assets/black.png');
    wall.x = -1000; //farrrrr left
    wall.y = 0;
    wall.height = renderer.view.height;

    //add a wall that ends the game if dinny is hit
    const death = createSprite('./assets/black.png');
    death.x = 0;
    death.y = renderer.view.height + dinnySpr.height;
    death.width = renderer.view.width;

    //add background
    const background = createSprite('./assets/background.png');
    //fill the canvas
    background.width = renderer.view.width;
    background.height = renderer.view.height;

    //MANAGER SETUP
    SpriteManager.add(dinnySpr);
    SpriteManager.add(platform);
    SpriteManager.add(wall);
    SpriteManager.add(death);
    TagManager.add("dinny", dinnySpr.uuid);
    TagManager.add("obstacle", platform.uuid);
    TagManager.add("obstacleDestroyer", wall.uuid);
    TagManager.add("dinnyDestroyer", death.uuid);
    //make dinny collide with all obstacles
    CollisionManager.add("dinny", "obstacle", function (dinny, other, isHit) {
        //put dinny on top of the obstacle if hit
        if (isHit) {
            dinny.y -= 5;
            dinnyJump = 20; //20 frames worth of jump power upon landing
        }
    }, function (obstacle, other, isHit) {
    }); 
    //make the obstacle destroyer collide with all obstacles
    CollisionManager.add("obstacleDestroyer", "obstacle", function (obstacleDestroyer, other, isHit) {
    }, function (obstacle, other, isHit) {
        if (isHit) {
            deleteSpriteFromStage(obstacle);
        }
    });
    //make the dinny destroyer collide with all dinnys
    CollisionManager.add("dinnyDestroyer", "dinny", function (dinnyDestroyer, other, isHit) {
    }, function (dinny, other, isHit) {
        if (isHit) {
            //end the game
            stopGame = true;
            deleteSpriteFromStage(dinny);
            endGame();
        }
    });
    //make dinny fall
    PhysicsManager.add("dinny", function (sprite) {
        sprite.y += 5;
    });
    //make platforms move
    PhysicsManager.add("obstacle", function (sprite) {
        sprite.x -= 4 + clock*.005;
    });

    //the score textbox
    const scoreText = new Text("Score: " + clock, {fontFamily: "Arial", fontSize: 20, fill: "white"});
    scoreText.x = 20;
    scoreText.y = 20;
    const uuid = SpriteManager.add(scoreText);
    TagManager.add("text", uuid);
    PhysicsManager.add("text", function (sprite) {
        sprite.text = "Score: " + clock;
    });

    //a check to see whether fast drop can happen
    const checker = createSprite('./assets/black.png');
    checker.x = dinnySpr.x;
    checker.y = dinnySpr.y += 15;
    checker.width = dinnySpr.width;
    checker.height = dinnySpr.height;
    SpriteManager.add(checker);
    TagManager.add("checker", checker.uuid);
    stage.addChild(checker);

    CollisionManager.add("checker", "obstacle", function (checker, other, isHit) {
        if (isHit) {
            disableFastDrop = true;
        }
    }, function (obstacle, other, isHit) {
    });

    PhysicsManager.add("checker", function (sprite) {
        disableFastDrop = false; //reset fastDrop every frame
        sprite.x = dinnySpr.x;
        sprite.y = dinnySpr.y + 15;
    });

    //STAGE SETUP
    //TODO: phases where groups of objects are added at a time (or find out if theres a depth property for pixi)
    stage.addChild(background);
    stage.addChild(death);
    stage.addChild(wall);
    stage.addChild(dinnySpr);
    stage.addChild(platform);
    stage.addChild(scoreText);
    renderer.render(stage);
    setupInputs();
    setupSpawner();
    startLoop();
}

//TODO: a way to hook up events or callbacks to subscribe to notifications such as collision detection
//TODO: a way to mass remove sprites through a tagging system
//TODO: a way to remove all children sprites in the managers through the parent container

function deleteSpriteFromStage (sprite) {
    stage.removeChild(sprite);
    sprite.teardown();
    sprite.destroy();    
}

function createSprite (resourceUrl) {
    if (Array.isArray(resourceUrl)) { //it's an animated sprite
        const frames = resourceUrl.map(function (url) {
            return PIXI.Texture.fromFrame(url);
        });
        return new PIXI.extras.AnimatedSprite(frames);
    }
    else { //it's a sprite
        return new Sprite(resources[resourceUrl].texture);
    }
}

function setupSpawner () {
    //spawn a new platform every now and then
    setInterval(function () {
        const platform = createSprite('./assets/platform.png');
        //spawn it outside the screen on the right
        platform.x = renderer.view.width + platform.width / 2;
        platform.y = 300 + Math.random() * 200 - 100;     
        platform.width = 150 + clock*.05;     
        SpriteManager.add(platform);
        TagManager.add("obstacle", platform.uuid);
        stage.addChild(platform);
    }, 800);
}

function setupInputs () {
    /*stage.interactive = true;
    stage.on("mousemove", function(e){
        sprite1.position.x = e.data.global.x;
        sprite1.position.y = e.data.global.y;
    });*/

    kd.SPACE.down(jumpFunc);
    kd.Z.down(fastDropFunc);

    function jumpFunc () {
        //move dinny up if theres enough energy to do so
        if (dinnyJump > 0) {
            const dinnys = TagManager.tags["dinny"];
            for (let dinny in dinnys) {
                const spr = SpriteManager.uuids[dinny];
                spr.y -= 15;
            }    
            dinnyJump--;
        }        
    }

    function fastDropFunc () {
        const dinnys = TagManager.tags["dinny"];
        for (let uuid in dinnys) {
            const dinny = SpriteManager.uuids[uuid];
            if (!disableFastDrop) {
                dinny.y += 15;
            }
        }    
    }
}

function endGame () {
    const scoreText = new Text("YOU FELL :(  refresh the browser to try again...", {fontFamily: "Arial", fontSize: 32, fill: "red"});
    scoreText.x = 30;
    scoreText.y = 150;    
    const uuid = SpriteManager.add(scoreText);
    stage.addChild(scoreText);
}

function startLoop () {
    if (stopGame) {
        return;
    }
    clock++;
    requestAnimationFrame(startLoop);
    kd.tick(); //keyboard detect logic
    PhysicsManager.act(); //physics logic
    checkForCollisions(); //collision logic
    renderer.render(stage);
}
