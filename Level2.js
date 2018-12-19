var Level2 = {



    preload: function () {

        //  We need this because the assets are on github pages
        //  Remove the next 2 lines if running locally
        game.load.baseURL = 'https://dimitrioueugenia.github.io/Shooter/';
        game.load.crossOrigin = 'anonymous';

        game.load.image('starfield', 'assets/starfield2.png');
        game.load.image('ship', 'assets/ship.png');
        game.load.image('bullet', 'assets/bullets/bullet.png');

        // New
        game.load.image('enemy2', 'assets/enemies/green-enemy.png');
        game.load.image('enemy3', 'assets/enemies/blue-enemy.png');
        game.load.spritesheet('explosion', 'assets/explode.png', 128, 128);
        game.load.bitmapFont('font', 'assets/spacefont/font.png', 'assets/spacefont/font.fnt');
        game.load.image('enemy3Bullet', 'assets/bullets/blue-enemy-bullet.png');

        game.load.audio('shoot', 'sound/shoot.wav');
        // game.load.audio('music', 'sound/music.mp3');
        game.load.audio('explosion-sound', 'sound/explosion.wav');

        game.load.image('redWeapon', 'assets/weapons/red.png');
        game.load.image('greenWeapon', 'assets/weapons/green.png');
        game.load.image('blueWeapon', 'assets/weapons/blue.png');

        game.load.image('boss', 'assets/enemies/boss.png');
        game.load.image('deathRay', 'assets/bullets/death-ray.png');
    },

    create: function () {
        score = 0;
        level = 2;
        game.scale.pageAlignHorizontally = true;

        //  The scrolling starfield background
        starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

        //  Our bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(500, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('offset')
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //  The hero!
        player = game.add.sprite(100, game.height / 2, 'ship');
        player.health = 100; // Add player health - New
        player.anchor.setTo(0.5, 0.5);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.maxVelocity.setTo(MAXSPEED, MAXSPEED);
        player.body.drag.setTo(DRAG, DRAG);
        player.weaponLevel = 1;
        player.events.onKilled.add(function () {
            shipTrail.kill();
        });
        player.events.onRevived.add(function () {
            shipTrail.start(false, 5000, 10);
        });

        boss = game.add.sprite(game.width, 0, 'boss');
        bossLaunched = false;
        boss.exists = false;
        boss.alive = false;
        boss.anchor.setTo(0.5, 0.5);
        boss.damageAmount = 50;
        boss.angle = 180;
        boss.scale.x = 0.6;
        boss.scale.y = 0.6;
        game.physics.enable(boss, Phaser.Physics.ARCADE);
        boss.body.maxVelocity.setTo(100, 80);
        boss.dying = false;
        boss.finishOff = function () {
            if (!boss.dying) {
                boss.dying = true;
                bossDeath.x = boss.x;
                bossDeath.y = boss.y;
                bossDeath.start(false, 1000, 50, 20);
                // kill boss after explosions
                game.time.events.add(1000, function () {
                    console.log('Exploding');
                    var explosion = explosions.getFirstExists(false);
                    var beforeScaleX = explosions.scale.x;
                    var beforeScaleY = explosions.scale.y;
                    var beforeAlpha = explosions.alpha;
                    // if (!explosion) return;
                    explosion.reset(boss.body.x + boss.body.halfWidth, boss.body.y + boss.body.halfHeight);
                    explosion.alpha = 0.4;
                    explosion.scale.x = 3;
                    explosion.scale.y = 3;
                    var animation = explosion.play('explosion', 30, false, true);
                    animation.onComplete.addOnce(function () {
                        explosion.scale.x = beforeScaleX;
                        explosion.scale.y = beforeScaleY;
                        explosion.alpha = beforeAlpha;
                    });
                    boss.kill();
                    // booster.kill();
                    boss.dying = false;
                    bossDeath.on = false;
                    // queue next boss or finish stage?
                    game.state.start('Menu');
                });
            }
        }
        function addRay(upDown) {
            var ray = game.add.sprite(0, upDown * boss.height * 0.8, 'deathRay');
            ray.angle = 0;
            ray.alive = false;
            ray.visible = false;
            boss.addChild(ray);
            ray.crop({ x: 0, y: 0, width: 40, height: 40 });
            ray.anchor.x = 0.5;
            ray.anchor.y = 0.5;
            ray.scale.x = 2.5;
            ray.damageAmount = boss.damageAmount;
            game.physics.enable(ray, Phaser.Physics.ARCADE);
            console.log('boss height: ' + boss.height);
            console.log('boss width: ' + boss.width);
            console.log('ray'+upDown+' at ' + ray.body.x + ', ' + ray.body.y);
            ray.body.gravity.y = 0;
            // ray.body.gravity.x = ray.body.gravity.y;
            // ray.body.gravity.y = 0;

            ray.body.setSize(ray.width / 5, ray.height / 4);
            ray.update = function () {
                this.alpha = game.rnd.realInRange(0.6, 1);
            };
            boss['ray' + (upDown > 0 ? 'Down': 'Up')] = ray;
        }
        addRay(1);
        addRay(-1);
        // need to add the ship texture to the group so it renders over the rays
        var ship = game.add.sprite(0, 0, 'boss');
        ship.anchor = { x: 0.5, y: 0.5 };

        boss.addChild(ship);

        boss.fire = function () {
            if (game.time.now > bossBulletTimer) {
                console.log('Boss firing');
                var raySpacing = 3000;
                var chargeTime = 1500;
                var rayTime = 1500;


                function chargeAndShoot(side) {
                    ray = boss['ray' + side];
                    ray.name = side;
                    ray.revive();
                    ray.x = 80;
                    ray.alpha = 0;
                    ray.scale.x = 13;
                    game.add.tween(ray).to({ alpha: 1 }, chargeTime, Phaser.Easing.Linear.In, true).onComplete.add(function (ray) {
                        ray.scale.x = 150;
                        game.add.tween(ray).to({ x: 0 }, rayTime, Phaser.Easing.Linear.In, true).onComplete.add(function (ray) {
                            ray.kill();
                        });
                    });
                }

                chargeAndShoot('Up');
                chargeAndShoot('Down');

                bossBulletTimer = game.time.now + raySpacing;
            }
        };

        boss.update = function () {
            if (!boss.alive) return;
            // console.log('x: ' + boss.x + ' y: ' + boss.y);
            boss.rayUp.update();
            boss.rayDown.update();

            if (boss.x > game.width - 140) {
                boss.body.acceleration.x = -50;
            }
            if (boss.x < game.width - 140) {
                boss.body.acceleration.x = 50;
            }

            if (boss.y > player.y + 50) {
                boss.body.acceleration.y = -50;
            } else if (boss.y < player.y - 50) {
                boss.body.acceleration.y = 50;
            } else {
                boss.body.acceleration.y = 0;
            }

            var bank = boss.body.velocity.x / MAXSPEED;
            boss.scale.y = 0.6 - Math.abs(bank) / 3;
            boss.angle = 180 - bank * 20;

            // booster.x = boss.x + -5 * bank;
            // booster.y = boss.y + 10 * Math.abs(bank) - boss.height / 2;

            var angleToPlayer = game.math.radToDeg(game.physics.arcade.angleBetween(boss, player)) - 90;
            var anglePointing = 180 - Math.abs(boss.angle);
            if (anglePointing - angleToPlayer < 10) {
                boss.fire();
            }
        };

        // boss's boosters
        // booster = game.add.emitter(boss.body.x, boss.body.y - boss.height / 2);
        // booster.width = 0;
        // booster.makeParticles('enemy3Bullet');
        // booster.forEach(function (p) {
        //     p.crop({ x: 0, y: 120, width: 45, height: 50 });
        //     p.anchor.x = 0.75;
        //     p.anchor.y = game.rnd.pick([1, -1] * 0.95 + 0.5);
        // });
        // booster.setXSpeed(-30, -50);
        // booster.setRotation(0, 0);
        // booster.setYSpeed(0, 0);
        // booster.gravity = 0;
        // booster.setAlpha(1, 0.1, 400);
        // booster.setScale(0.3, 0, 0.7, 0, 5000, Phaser.Easing.Quadratic.Out);
        boss.bringToTop();


        //  And some controls to play the game with
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        //  Add an emitter for the ship's trail
        shipTrail = game.add.emitter(player.x - 20, player.y, 400);
        shipTrail.height = 10;
        shipTrail.makeParticles('bullet');
        shipTrail.setYSpeed(20, -20);
        shipTrail.setXSpeed(-140, -120);
        shipTrail.setRotation(50, -50);
        shipTrail.setAlpha(1, 0.01, 800);
        shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000,
            Phaser.Easing.Quintic.Out);
        shipTrail.start(false, 5000, 10);

        // Add explosions pool - New

        explosions = game.add.group();
        explosions.enableBody = true;
        explosions.physicsBodyType = Phaser.Physics.ARCADE;
        explosions.createMultiple(100, 'explosion');
        explosions.setAll('anchor.x', 0.5);
        explosions.setAll('anchor.y', 0.5);
        explosions.forEach(function (explosion) {
            explosion.animations.add('explosion');
        });

        bossDeath = game.add.emitter(boss.x, boss.y);
        bossDeath.width = boss.width/2;
        bossDeath.height = boss.height/2;
        bossDeath.makeParticles('explosion', [0, 1, 2, 3, 4, 5, 6, 7], 10);
        bossDeath.setAlpha(0.9, 0, 900);
        bossDeath.setScale(0.3, 1.0, 0.3, 1.0, 1000, Phaser.Easing.Quintic.Out);

        // Shields stat - New
        shields = game.add.bitmapText(game.world.width - 300, 10, 'font', '' + player.health, 50);
        shields.render = function () {
            shields.text = 'SHIELDS ' + Math.max(player.health, 0) + '%';
        }
        shields.render();

        // Score - New
        // scoreText = game.add.text(10, 10, '', {font: '20px Arial', fill: '#fff'});
        scoreText = game.add.bitmapText(10, 10, 'font', '', 50);
        scoreText.render = function () {
            scoreText.text = 'SCORE ' + score;
        };
        scoreText.render();

        // Add enemies2 - New
        enemies2 = game.add.group();
        enemies2.enableBody = true;
        enemies2.physicsBodyType = Phaser.Physics.ARCADE;
        enemies2.createMultiple(5, 'enemy2');
        enemies2.setAll('anchor.x', 0.7);
        enemies2.setAll('anchor.y', 0.5);
        enemies2.setAll('scale.x', 0.5);
        enemies2.setAll('scale.y', 0.5);
        enemies2.setAll('angle', 180);
        enemies2.setAll('outOfBoundsKill', true);
        enemies2.setAll('checkWorldBounds', true);

        enemies2.forEach(function (enemy) {
            addEnemyEmitterTrail(enemy);
            enemy.body.setSize(enemy.width * 1.5, enemy.height)
            enemy.damageAmount = 20;
            enemy.events.onKilled.add(function () {
                enemy.trail.kill();
            });
        });

        game.time.events.add(1000, launchEnemy2);

        // Add enemy 3 - New
        enemy3Launched = false;
        enemies3 = game.add.group();
        enemies3.enableBody = true;
        enemies3.physicsBodyType = Phaser.Physics.ARCADE;
        enemies3.createMultiple(30, 'enemy3');
        enemies3.setAll('anchor.x', 0.5);
        enemies3.setAll('anchor.y', 0.5);
        enemies3.setAll('scale.x', 0.5);
        enemies3.setAll('scale.y', 0.5);
        enemies3.setAll('angle', 180);
        enemies3.forEach(function (enemy) {
            enemy.damageAmount = 40;
        });

        // game.time.events.add(1000, launchEnemy3);

        // Enemy3 bullets - New
        enemy3Bullets = game.add.group();
        enemy3Bullets.enableBody = true;
        enemy3Bullets.physicsBody = Phaser.Physics.ARCADE;
        enemy3Bullets.createMultiple(30, 'enemy3Bullet');
        enemy3Bullets.callAll('crop', null, { x: 90, y: 0, width: 90, height: 70 });
        enemy3Bullets.setAll('alpha', 0.9);
        enemy3Bullets.setAll('anchor.x', 0.46);
        enemy3Bullets.setAll('anchor.y', 0.35);
        enemy3Bullets.setAll('outOfBoundsKill', true);
        enemy3Bullets.setAll('checkWorldBounds', true);
        enemy3Bullets.forEach(function (enemy) {
            enemy.body.setSize(50, 20);
        });

        // Spawn weapons - New
        weapons = game.add.group();
        weapons.enableBody = true;
        weapons.physicsBody = Phaser.Physics.ARCADE;
        weapons.createMultiple(5, 'blueWeapon');
        weapons.setAll('anchor.x', 0.5);
        weapons.setAll('anchor.y', 0.5);
        weapons.setAll('scale.x', 0.5);
        weapons.setAll('scale.y', 0.5);
        weapons.setAll('angle', 180);
        weapons.setAll('outOfBoundsKill', true);
        weapons.setAll('checkWorldBounds', true);

        console.log('Launching weapon in 10');
        game.time.events.add(10000, launchWeapon);

        // Add sound - New
        shooting_effect = game.add.audio('shoot');
        explosion_effect = game.add.audio('explosion-sound');
        // music = game.add.audio('music');
        // music.play();

        // Game over text - New
        // gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', { font: '84px Arial', fill: '#fff'});
        // gameOver.anchor.setTo(0.5, 0.5);

        gameOver = game.add.bitmapText(game.world.centerX, game.world.centerY, 'font', 'GAME OVER', 110);
        gameOver.x = gameOver.x - gameOver.textWidth / 2;
        gameOver.y = gameOver.y - gameOver.textHeight / 3;
        gameOver.visible = false;
    },

    update: function () {

        //  Scroll the background
        starfield.tilePosition.x -= 2;

        //  Reset the player, then check for movement keys
        player.body.acceleration.y = 0;
        player.body.acceleration.x = 0;

        if (cursors.up.isDown) {
            player.body.acceleration.y = -ACCELERATION;
        } else if (cursors.down.isDown) {
            player.body.acceleration.y = ACCELERATION;
        }
        if (cursors.left.isDown) {
            player.body.acceleration.x = -ACCELERATION;
        } else if (cursors.right.isDown) {
            player.body.acceleration.x = ACCELERATION;
        }

        //  Stop at screen edges
        if (player.x > game.width - 30) {
            player.x = game.width - 30;
            player.body.acceleration.x = 0;
        }
        if (player.x < 30) {
            player.x = 30;
            player.body.acceleration.x = 0;
        }
        if (player.y > game.height - 15) {
            player.y = game.height - 15;
            player.body.acceleration.y = 0;
        }
        if (player.y < 15) {
            player.y = 15;
            player.body.acceleration.y = 0;
        }

        //  Fire bullet
        if (player.alive && fireButton.isDown) {
            fireBullet();
        }

        //  Keep the shipTrail lined up with the ship
        shipTrail.y = player.y;
        shipTrail.x = player.x - 20;

        // Check for collisions - New

        game.physics.arcade.overlap(player, enemies2, shipCollide, null, this);
        game.physics.arcade.overlap(enemies2, bullets, hitEnemy, null, this);

        game.physics.arcade.overlap(player, enemies3, shipCollide, null, this);
        game.physics.arcade.overlap(enemies3, bullets, hitEnemy, null, this);
        game.physics.arcade.overlap(enemy3Bullets, player, enemyHitsPlayer, null, this);
        game.physics.arcade.overlap(player, weapons, changeWeapons, null, this);

        game.physics.arcade.overlap(boss, bullets, hitEnemy, bossHitTest, this);
        if (bossLaunched) {
            game.physics.arcade.overlap(player, boss.rayUp, enemyHitsPlayer, null, this);
            game.physics.arcade.overlap(player, boss.rayDown, enemyHitsPlayer, null, this);
        }
        if (!player.alive && gameOver.visible === false) {
            gameOver.visible = true;
            var fadeInGameOver = game.add.tween(gameOver);
            fadeInGameOver.to({ alpha: 1 }, 1000, Phaser.Easing.Quintic.Out);
            fadeInGameOver.onComplete.add(setResetHandlers);
            fadeInGameOver.start();
            function setResetHandlers() {
                tapRestart = game.input.onTap.addOnce(_restart, this);
                spaceRestart = fireButton.onDown.addOnce(_restart, this);
                function _restart() {
                    tapRestart.detach();
                    spaceRestart.detach();
                    restart();
                }
            }
        }

    },

    render: function () {
        // for (var i = 0; i < enemies2.length; i++) {
        // 	game.debug.body(enemies2.children[i]);
        // }
        // game.debug.body(player);
        // for (var i=0; i < enemy3Bullets.length; i++) {
        // 	game.debug.body(enemy3Bullets.children[i]);
        // }

        // for (var i=0; i < enemies3.length; i++) {
        //     game.debug.body(enemies3.children[i]);
        // }
    }
}
