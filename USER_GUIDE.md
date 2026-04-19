# Pim Tiles

Pim Tiles is a tilemap editor for creating pixel worlds, primarily designed for retro top-down maps.

## Project Settings

A project's name, tile size, columns (width), rows (height), and grid color can be changed in **Project → Settings**.

Tile size is limited to 16 or 32 pixels, and the number of rows and columns is limited to 2–250 tiles, as the editor is designed to support smaller-sized projects.

## Layers

There are three types of layers: **tile layers**, **autotile layers** and **object layers**.

Depending on which layer type is selected in the Layers list, you can paint using different assets and the layers have different exports.

## Assets

There are two types of assets: **tilesets**, and **autotiles**. You paint with tiles on tile layers and object layers while auto tiles are used on auto tile layers.

### Tilesets

A tileset is created by uploading a spritesheet. Supported image formats are **PNG** and **WebP**.

The spritesheet is displayed on the tileset canvas, where you can select one or more tiles to paint with.

Make sure that your spritesheet tile size matches the project's tile size.

### Autotiles

The editor implements rule-based 8-direction autotiles.

An autotile is created in the Autotile dialog by entering a name, selecting a default tile, and defining a set of rules that determine which tiles are placed when painting.

Each tile rule consists of:

- A tile
- Rules defining whether its 8 neighbors must:
  - Be part of the same autotile (**required**)
  - Be excluded from the same autotile (**excluded**)
  - Not matter (**optional**)

You can paint with an autotile by selecting it from the Autotiles list.

## Tools

There are 3 types of tools to edit the tilemap:

- **Paint (shortcut key Q/q)** – Paint tile(s) or autotiles.
- **Erase (shortcut key W/w)** – Erase tiles.
- **Selection (shortcut key E/e)** – Select parts of the tilemap to move, copy (Ctrl + C), or delete (Del/Backspace).

And there is also a modifier:

- **Fill (shortcut key R/r)** – Flood fills parts of the tilemap. Can be used on tile layers when either paint or erase tool is active.

## Attributes

There are three levels of attributes that a tile in the tilemap can inherit from:

- **Painted tile attributes** – Attributes for a painted tile, can be edited by right clicking a tile in the tilemap.
- **Autotile attributes** – Attributes for an autotile, can be edited in the auto tile dialog. All tiles included in the autotile inherits this attribute.
- **Tile attributes** – Attributes for the tile asset, can be edited by right clicking the tile in the tileset canvas.

The precdence in case of name collisions are: painted tile attributes, tile attributes, autotile attributes.

## Objects

Object layers works almost the same as tile layers, but are exported as objects and not a part of the static tilemap. To create an object you add the 'object' attribute to a tile with its name as the value, in the tileset canvas or a painted tile on the tilemap. Width and height are also mandatory for this to work. The objects are exported as a list of objects with their name, dimensions, a base64 image and the rest of the attributes for the tile that you marked as an object. The image for the object is a merged image
of all the object layers for that object, i.e. overlapping objects are not supported. This is a WIP feature!

## Export

You can export the project as **PNG** or **JSON**.

The project can also be saved in a json format, which can later be loaded back into the editor.
