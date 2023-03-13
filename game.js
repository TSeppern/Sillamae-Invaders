const KEY_CODE_LEFT = 37
const KEY_CODE_RIGHT = 39
const KEY_CODE_SPACE = 32
const KEY_CODE_ESCAPE = 27

const GAME_WIDTH = 800
const GAME_HEIGHT = 600

const PLAYER_WIDTH = 20
const PLAYER_MAX_SPEED = 600.0
const LASER_MAX_SPEED = 300.0
const LASER_COOLDOWN = 0.4

const ENEMIES_PER_ROW = 10
const ENEMY_HORIZONTAL_PADDING = 80
const ENEMY_VERTICAL_PADDING = 70
const ENEMY_VERTICAL_SPACING = 80
const ENEMY_COOLDOWN = 4.0

const scoreEl = document.querySelector('#scoreEl')
const livesEl = document.querySelector('#livesEl')
const timeEl = document.querySelector('#timeEl')
let score = 0
let lives = 3
let s = 0
let t

const GAME_STATE = {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    escapePressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    lasers: [],
    enemies: [],
    enemyLasers: [],
    paused: false,
    gameOver: false

}

function rectsIntersect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    )
}

function setPosition($el, x, y) {
    $el.style.transform = `translate(${x}px, ${y}px)`
}

function clamp(v, min, max) {
    if (v < min) {
        return min
    } else if (v > max) {
        return max
    } else {
        return v
    }
}

function rand(min, max) {
    if (min === undefined) min = 0
    if (max === undefined) max = 1
    return min + Math.random() * (max - min)
}

function createPlayer($container) {
    GAME_STATE.playerX = GAME_WIDTH / 2
    GAME_STATE.playerY = GAME_HEIGHT - 50
    const $player = document.createElement("img")
    $player.src = "img/player.png"
    $player.className = "player"
    $container.appendChild($player)
    setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY)
}

function destroyPlayer($container, player) {
    $container.removeChild(player)
    GAME_STATE.gameOver = true
    const audio = new Audio("sound/playerkilled.wav")
    audio.play()
}

function updatePlayer(dt, $container) {
    if (GAME_STATE.leftPressed) {
        GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED
    }
    if (GAME_STATE.rightPressed) {
        GAME_STATE.playerX += dt * PLAYER_MAX_SPEED
    }
    
    GAME_STATE.playerX = clamp(
        GAME_STATE.playerX,
        PLAYER_WIDTH,
        GAME_WIDTH - PLAYER_WIDTH
        )
        
    if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
    createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY)
    GAME_STATE.playerCooldown = LASER_COOLDOWN  
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt
    }
    
    const player = document.querySelector(".player")
    setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY)
}

function createLaser($container, x, y) {
    const $element = document.createElement("img")
    $element.src = "img/laser-blue-1.png"
    $element.className = "laser"
    $container.appendChild($element)
    const laser = { x, y, $element }
    GAME_STATE.lasers.push(laser)
    const audio = new Audio("sound/shoot.wav")
    audio.play()
    setPosition($element, x, y)
}

function updateLasers(dt, $container) {
    const lasers = GAME_STATE.lasers
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i]
        laser.y -= dt * LASER_MAX_SPEED
        if (laser.y < 0) {
            destroyLaser($container, laser)
        }
        setPosition(laser.$element, laser.x, laser.y)
        const r1 = laser.$element.getBoundingClientRect()
        const enemies = GAME_STATE.enemies
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j]
            if (enemy.isDead) continue
            const r2 = enemy.$element.getBoundingClientRect()
            if (rectsIntersect(r1, r2)) {
                destroyEnemy($container, enemy)
                destroyLaser($container, laser)
                break
            }
        }
    }
    GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead)
}

function destroyLaser($container, laser) {
    $container.removeChild(laser.$element)
    laser.isDead = true
}

function createEnemy($container, x, y) {
    const $element = document.createElement("img")
    $element.src = "img/tank.png"
    $element.className = "enemy"
    $container.appendChild($element)
    const enemy = {
        x,
        y,
        cooldown: rand(0.5, ENEMY_COOLDOWN),
        $element
    }
    GAME_STATE.enemies.push(enemy)
    setPosition($element, x, y)
}

function updateEnemies(dt, $container) {
    const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50
    const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10
    
    const enemies = GAME_STATE.enemies
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i]
        const x = enemy.x + dx
        const y = enemy.y + dy
        setPosition(enemy.$element, x, y)
        enemy.cooldown -= dt;
        if (enemy.cooldown <= 0) {
            createEnemyLaser($container, x, y)
            enemy.cooldown = ENEMY_COOLDOWN
        }
    }
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead)
}

function destroyEnemy($container, enemy) {
    $container.removeChild(enemy.$element)
    enemy.isDead = true
    score += 100
    scoreEl.innerHTML = score
    const audio = new Audio("sound/explosion.wav")
    audio.play()
}

function createEnemyLaser($container, x, y) {
    const $element = document.createElement("img")
    $element.src = "img/laser-red-5.png"
    $element.className = "enemy-laser"
    $container.appendChild($element)
    const laser = { x, y, $element }
    GAME_STATE.enemyLasers.push(laser)
    setPosition($element, x, y)
}

function updateEnemyLasers(dt, $container) {
    const lasers = GAME_STATE.enemyLasers
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i]
        laser.y += dt * LASER_MAX_SPEED
        if (laser.y > GAME_HEIGHT) {
            destroyLaser($container, laser)
        }
        setPosition(laser.$element, laser.x, laser.y)
        const r1 = laser.$element.getBoundingClientRect()
        const player = document.querySelector(".player")
        const r2 = player.getBoundingClientRect()
        if (rectsIntersect(r1, r2)) {
            $container.removeChild(laser.$element)
            laser.isDead = true
            const audio = new Audio("sound/hit.wav")
        audio.play()
        }
        if (rectsIntersect(r1, r2)) {
            lives--
        }
        livesEl.innerHTML = lives
        if (lives === 0) {
            destroyPlayer($container, player)
            break
        }
    }
    GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead)
}

function pauseMenu() {
    console.log("pauseMenu running");
    if (GAME_STATE.escapePressed) {
        GAME_STATE.paused = true
        if (GAME_STATE.paused) {
            GAME_STATE.paused = true
            GAME_STATE.escapePressed = false
        } else {
            GAME_STATE.paused = false
            GAME_STATE.escapePressed = false
        }
    }

    if (GAME_STATE.paused) {
        document.querySelector(".pause").style.display = "block"
    } else {
        document.querySelector(".pause").style.display = "none"
    }
    if (GAME_STATE.paused) {
        window.cancelAnimationFrame(update)
    }
}

function init() {
    const $container = document.querySelector(".game")

    const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1)
    for (let j = 0; j < 3; j++) {
        const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING
        for (let i = 0; i < ENEMIES_PER_ROW; i++) {
            const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING
            createEnemy($container, x, y)
        }
    }
    createPlayer($container)
    createPlayer = (function() {
        var executed = false
        return function() {
            if (!executed) {
                executed = true
            }
        }
    })
    document.querySelector(".continue").addEventListener('click', () => {
        document.querySelector(".pause").style.display = "none"
        GAME_STATE.paused = false
        window.requestAnimationFrame(update)
    })
}

function update() {
    const currentTime = Date.now()
    const dt = (currentTime - GAME_STATE.lastTime) / 1000.0
    t = setInterval(function () {
        s++
        t = t / 100
        
    }, 1000);
    t = t / 120 | 0
    timeEl.innerHTML = t
    
    if (GAME_STATE.gameOver) {
        document.querySelector(".game-over").style.display = "block"
        return
    }
    if (GAME_STATE.paused) {
        document.querySelector(".pause").style.display = "block"
        return
    } else {
        document.querySelector(".pause").style.display = "none"
    }
    
    const $container = document.querySelector(".game")
    updatePlayer(dt, $container)
    updateLasers(dt, $container)
    updateEnemies(dt, $container)
    updateEnemyLasers(dt, $container)
    
    GAME_STATE.lastTime = currentTime
    window.requestAnimationFrame(update)
    
    if (GAME_STATE.enemies.length === 0) {
        init()
        update()
        return createPlayer
    }
    pauseMenu()
}

function onKeyDown(e) {
    if (e.keyCode === KEY_CODE_LEFT) {
        GAME_STATE.leftPressed = true
    } else if (e.keyCode === KEY_CODE_RIGHT) {
        GAME_STATE.rightPressed = true
    } else if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spacePressed = true
    }else if (e.keyCode === KEY_CODE_ESCAPE) {
        GAME_STATE.escapePressed = true
    }
}

function onKeyUp(e) {
    if (e.keyCode === KEY_CODE_LEFT) { 
        GAME_STATE.leftPressed = false
    } else if (e.keyCode === KEY_CODE_RIGHT) { 
        GAME_STATE.rightPressed = false
    } else if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spacePressed = false
    }else if (e.keyCode === KEY_CODE_ESCAPE) {
        GAME_STATE.escapePressed = false
    }
}



init()
window.addEventListener("keydown", onKeyDown)
window.addEventListener("keyup", onKeyUp)
window.requestAnimationFrame(update)