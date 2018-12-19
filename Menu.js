var Menu = {
    preload: function () {
        game.load.audio('music', 'sound/music.mp3');
        game.load.image('stage1', 'assets/level1.png');
        game.load.image('stage2', 'assets/level2.png');

        game.load.image('background', 'assets/menu.png');
    },

    create: function () {
        var button1;
        var button2;

        music = game.add.audio('music', 1, true);
        music.play();


        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.physics.startSystem(Phaser.Physics.ARCADE);

        var bg = game.add.image(0, 0, 'background');

        button1 = game.add.button(game.width - 230, 200, 'stage1', click1, this, function () { });
        button2 = game.add.button(game.width - 230, 350, 'stage2', click2, this, function () { });

        function click1() {
            game.state.start('Level1');
        }
        function click2() {
            game.state.start('Level2');
        }
    }
}