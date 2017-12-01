//collision-related functions

//code by kittykatattack
function hitTestRectangle(r1, r2) {
    //Define the variables we'll need to calculate
    var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
    //hit will determine whether there's a collision
    hit = false;
    //Find the center points of each sprite
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;
    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;
    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;
    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;
    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {
        //A collision might be occuring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {
            //There's definitely a collision happening
            hit = true;
        } 
        else {
            //There's no collision on the y axis
            hit = false;
        }
    } 
    else {
            //There's no collision on the x axis
            hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
};




//relies on the collision manager and tag manager to determine collisions
function checkForCollisions () {
    collisionHandler(hitTestRectangle);
}

function collisionHandler (collisionFunc) {
    const CM = CollisionManager;
    const tagPairs = CM.getUniquePairs();
    for (let tagPair in tagPairs) {
        const tagPairTwin = CM.getTwin(tagPair);
        const tag1 = CM.getFront(tagPair);
        const tag2 = CM.getBack(tagPair);
        //find all sprites that are assigned these tags
        const spriteSet1 = TagManager.tags[tag1];
        const spriteSet2 = TagManager.tags[tag2];
        //these sprites need collision checks
        for (let uuid1 in spriteSet1) {
            for (let uuid2 in spriteSet2) {
                //find the sprites from the uuids
                const spr1 = SpriteManager.uuids[uuid1];
                const spr2 = SpriteManager.uuids[uuid2];
                const collisionResult = collisionFunc(spr1, spr2);
                //invoke the collision callbacks based on the tags of the sprite
                CM.hash[tagPair](spr1, spr2, collisionResult);
                CM.hash[tagPairTwin](spr2, spr1, collisionResult);
            }
        }               
    }
}