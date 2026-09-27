# Animation revision

Open `index.html` to play the full game. Open `animation-preview.html` to inspect weapons, poses, two-hand grip, movement direction and slow motion without starting a save.

- Player-specific animation curves for locomotion, attacks, guard, deflect, stagger, casting, drinking, throwing, dodge/backstep, mounting and death.
- Footsteps follow distance and actual movement direction, including strafing. Cloak and upper body follow the step cycle.
- Attack windup, strike and recovery have continuous keyframes; brief entrance blends soften action changes.
- Two-hand grip uses fixed-length upper arms and forearms with elbows. Both weapon grips are constrained to reach; the weapon moves with the hands. Spears use a closer support grip instead of reaching down the shaft.
- Drinking raises a visible flask and temporarily releases the off hand.
- Gameplay damage, collision, stamina, action durations and invulnerability rules are unchanged.

Files changed: src/render.js, index.html, sw.js. Added: src/player-animation.js and animation-preview.html.

Validation: JavaScript syntax checks; direct Canvas rendering across 30 weapon looks, action variants and states (21,240 render samples); 4,500 two-hand reach samples; visual inspection of representative sword, greatsword, spear and bow poses. Full interactive browser playthrough was unavailable in the execution environment; please playtest transitions in the included preview and game.
