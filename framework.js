//useful data structure for handling pairs of data
//relies on none of the strings containing ':'
function PairedHash (character) {
    const separator = character;
    let hash = {};
    const self = {
        add: function (str1, str2, value1, value2) {
            if (str1.indexOf(separator) !== -1) {
                throw new Error(str1 + " must not contain this character: " + separator)
            }
            hash[str1 + separator + str2] = value1;
            hash[str2 + separator + str1] = value2;
        },
        removePair: function (str1, str2) {
            delete hash[str1 + separator + str2];
            delete hash[str2 + separator + str1];
        },
        remove: function (str) {
            //iterate through the hash and remove all string matches of str
            for (let value in hash) {
                if (value.indexOf(str) !== -1) { //match
                    delete hash[value];
                }
            }
        },
        getFront: function (str) {
            return str.split(":")[0];
        },
        getBack: function (str) {
            return str.split(":")[1];
        },
        getTwin: function (str) {
            return str.split(":")[1] + ":" + str.split(":")[0];
        },
        getUniquePairs: function () {
            let ignored = {};
            let uniquePairs = {};
            for (let pair in hash) {
                const pairTwin = self.getTwin(pair);
                if (!ignored[pair]) { //shorter method to check for uniqueness
                    ignored[pairTwin] = true;
                    uniquePairs[pair] = true;      
                }
            }        
            return uniquePairs;    
        },
        hash: hash
    };
    return self;
}

const CollisionManager = (function () {
    return new PairedHash(":"); //don't like the colon? change it here
})();

//TODO: use the pair hash?
//must go second
/*
const TagManager = (function () {
    //let tags = {};
    let tags =  new PairedHash(":");
    return {
        add: function (tagName, uuid) { //uuid is optional
            tags.add(tagName, uuid, true, true);
        },
        removeUuid: function (uuid) {
            //search the tags for all instances of this uuid
            for (let tagName in tags) {
                for (let id in tags[tagName]) {
                    if (id === uuid) { //found a match
                        delete tags[tagName][id];
                    }
                }
            }
        },
        removeTag: function (tagName) {
            delete tags[tagName];
            //delete tag from collision manager if it exists
            CollisionManager.remove(tagName);
        },
        tags: tags
    };
})();
*/

const TagManager = (function () {
    let tags = {};
    return {
        add: function (tagName, uuid) { //uuid is optional
            if (!tags[tagName]) { //initialize if the tag name doesn't exist
                tags[tagName] = {};
            }
            if (uuid) {
                tags[tagName][uuid] = true; //TODO: find a use for this value
            }
        },
        removeUuid: function (uuid) {
            //search the tags for all instances of this uuid
            for (let tagName in tags) {
                for (let id in tags[tagName]) {
                    if (id === uuid) { //found a match
                        delete tags[tagName][id];
                    }
                }
            }
        },
        removeTag: function (tagName) {
            delete tags[tagName];
            //delete tag from collision manager if it exists
            CollisionManager.remove(tagName);
            PhysicsManager.remove(tagName);
        },
        tags: tags
    };
})();

//must go third
const SpriteManager = (function () {
    let uuids = {};
    let self = {
        add: function (sprite) {
            const id = uuidv4();
            uuids[id] = sprite; //add sprite to uuid object
            //attach a teardown() method and the uuid on this sprite
            sprite.uuid = id;
            sprite.teardown = function () {
                self.remove(id);
            }
            return id;
        },
        remove: function (uuid) {
            delete uuids[uuid];
            //delete uuid from tag manager if it exists
            TagManager.removeUuid(uuid);
        },
        uuids: uuids
    };
    return self;
})();


const PhysicsManager = (function () {
    //tag -> function
    let subjects = {};
    return {
        add: function (tagName, func) {
            subjects[tagName] = func;
        },
        remove: function (tagName) {
            delete subjects[tagName];
        },
        subjects: subjects,
        act: function () {
            for (let tag in subjects) {
                const func = subjects[tag];
                const uuids = TagManager.tags[tag];
                for (let uuid in uuids) {
                    func(SpriteManager.uuids[uuid]);
                }
            }
        }
    }
})();