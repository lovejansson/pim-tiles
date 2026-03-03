# Pim Tiles

Pim Tiles is a tilemap editor for creating pixel worlds, primarily designed for retro top-down maps.

## Project Settings

A project's name, tile size, columns (width), rows (height), and grid color can be changed in **Project → Settings**.

Tile size is limited to 16 or 32 pixels, and the number of rows and columns is limited to 2–250 tiles, as the editor is designed to support smaller-sized projects.

## Layers

There are three types of layers: **tile layers**, **autotile layers**, and **area layers**.

Depending on which layer type is selected in the Layers list, you can paint using different assets.

## Assets

There are three types of assets: **tilesets**, **areas**, and **autotiles**.

### Tilesets

A tileset is created by uploading a spritesheet. Supported image formats are **PNG** and **WebP**.

The spritesheet is displayed on the tileset canvas, where you can select one or more tiles to paint with.

Make sure that your spritesheet tile size matches the project's tile size.

### Areas

An area is created by entering a name, selecting a color to paint with, and specifying whether the area is walkable.

You can paint with an area by selecting it from the Areas list.

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

## Export

You can export the project as **PNG** or **JSON**.

The project can also be saved in a binary `.ptm` format, which can later be loaded back into the editor.
