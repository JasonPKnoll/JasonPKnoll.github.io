---
title: Koi Pond (WIP)
layout: page
---

> **Koi fish pond built in Unity for a Virtual Environment. Koi fish
    responsively detect and avoid walls, seek out food, and reproduce. Koi fish
    offspring inherit the colors of their parents.**

>
### GitHub Repository 
>
## <b>🐟 <a href="https://github.com/JasonPKnoll/koi_pond">Koi Fish Pond</a> 🐟</b>
<hr style="border:2px solid grey">

### Event Triggers
> The Koi fish have gravity applied upon leaving the water, and taken off when entering back into the water

<img src="/assets/images/koi_pond/koi_yeet.gif">
<hr style="border:2px solid grey">

### Swimming
> The Koi fish will reorient themselves to face upright when being put back into water.

<img src="/assets/images/koi_pond/koi_repo.gif">

> The Koi will avoid running into walls. This will be expanded upon in the future to give them multiple actions they can take upon first detecting a wall. For now they will just turn away from it. 

<img src="/assets/images/koi_pond/koi_avoid.gif">
<hr style="border:2px solid grey">

### Food
> Spawn in food that can be given to the fish. Food gains gravity when dropped, and has a simple function to float when thrown into the water.

<img src="/assets/images/koi_pond/koi_food.gif">

> Feed the Koi and watch them grow. Koi will grow to a max size, which will then allow them to have offspring.

<img src="/assets/images/koi_pond/koi_feed.gif">
<hr style="border:2px solid grey">

### Swap Koi
> Don't like the colors of one of the Koi fish? Swap them out for a new Koi with randomly generated colors.

<img src="/assets/images/koi_pond/koi_swap.gif">
<hr style="border:2px solid grey">

### Cook Koi
> Feeling a bit more destructive? Throw the koi into the "fire" and cook them. The spawned in cooked Koi will be the same size as the fresh Koi was. 

<img src="/assets/images/koi_pond/koi_cook.gif">
<hr style="border:2px solid grey">

### Shader
> The shader is very early on and still a big work in progress much like everything else. This shader was built using a node-based shader creation tool called Amplify. The main goals of this shader are to give the fish two distinct colors ,and a pattern that can be altered via propreity blocks in the C# code, and to give the Koi fish the appearance of wiggling in the water. 

<br>

> This gives the Koi a pattern with two distinct colors. Need to find an alternative solution to the noise generator as it is an unoptimized solution to creating a pattern.
> 
<img src="/assets/images/koi_pond/shader_texture.png">

> This manipulates the vertices on the Koi based on a sin equation.
> 
<img src="/assets/images/koi_pond/shader_movement.png">

> This manipulates the vertices on the Koi based on the Kois position in the world.
> 
<img src="/assets/images/koi_pond/shader_movement_2.png">

> The end results of the shader so far.
>
<img src="/assets/images/koi_pond/koi_shader.gif">

<hr style="border:2px solid grey">