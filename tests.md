# System tests

| Context    | Test                                                                                           | Status | Bugs                                              |
| ---------- | ---------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| Project    | Can create new project which wipes any current work                                            | OK     |                                                   |
| Project    | Can load a project from file JSON                                                              | OK     |                                                   |
| Project    | Can download project to file JSON                                                              | OK     |                                                   |
| Project    | Can export project as JSON                                                                     | OK     |                                                   |
| --------   | ------------------------------------------------------------------------                       | ------ | ----                                              |
| Settings   | Can toggle show grid                                                                           | OK     |                                                   |
| Settings   | Can change tilesize 16, or 32                                                                  | OK     |                                                   |
| Settings   | Can change cols and rows                                                                       | OK     |                                                   |
| Settings   | Maximum cols and rows in tiles is 250 tiles                                                    | OK     |                                                   |
| Settings   | When dimensions change, the tilemap is cleared and resized                                     | OK     |                                                   |
| Settings   | Can change project name                                                                        | OK     |                                                   |
| Settings   | Can change grid color                                                                          | OK     |                                                   |
| --------   | -------------------------------------------------------------------------                      | ------ | ----                                              |
| Layers     | Create layer                                                                                   | OK     |                                                   |
| Layers     | Edit name of layer                                                                             | OK     |                                                   |
| Layers     | Delete layer                                                                                   | OK     |                                                   |
| Layers     | Toggle visibility for layer, only visble layers are displayed on tilemap and can be painted on | OK     |                                                   |
| Layers     | Drag do reorder layers, layers are rendered in their order                                     | BUGGY  | Svelte DND laggs when it comes to dynamic classes |
| Layers     | Different types of layers, tile and auto-tile are shown as icon/tooltip                        | OK     |                                                   |
| --------   | ------------------------------------------------------------------------                       | ------ | ----                                              |
| Tilesets   | Upload tileset in png format                                                                   | OK     |                                                   |
| Tilesets   | Uploaded tileset is named after filename                                                       | OK     |                                                   |
| Tilesets   | If tileset with filename already exists the name is suffixed with (n)                          | OK     |                                                   |
| Tilesets   | Delete tileset                                                                                 | OK     |                                                   |
| Tilesets   | Can't delete tileset that is used in auto tile or tilemap                                      | OK     |                                                   |
| Tilesets   | Select tiles to paint with in tileset by selecting area on canvas                              | OK     |                                                   |
| Tilesets   | Selected tiles can only be painted on tile layers                                              | OK     |                                                   |
| Tilesets   | Rename tileset                                                                                 | OK     |                                                   |
| Tilesets   | Can't rename tileset to a name that already exists                                             | OK     |                                                   |
| --------   | ------------------------------------------------------------------------                       | ------ | ----------------                                  |
| Autotile   | Create auto tile                                                                               | OK     |                                                   |
| Autotile   | Edit auto tile                                                                                 | OK     |                                                   |
| Autotile   | Autotile requires a default tile and name, each tile rule has to have a tile                   | OK     |                                                   |
| Autotile   | Create a tile rule by selecting connections and choosing a tile                                | OK     |                                                   |
| Autotile   | Use fast buttons to generate tile rules with preset connections                                | OK     |                                                   |
| Autotile   | Delete auto tile                                                                               | OK     |                                                   |
| Autotile   | Auto tiles can't be deleted if they are used in tilemap                                        | Ok     |                                                   |
| --------   | ------------------------------------------------------------------------                       | ------ | ----                                              |
| Tilemap    | Paint with 1 or more tiles                                                                     | OK     |                                                   |
| Tilemap    | Paint with an auto tile and see how the neighbours update according to rules                   | OK     |                                                   |
| Tilemap    | Fill tool can be used to fill tiles on tile layers on tile layers                              | OK     |                                                   |
| Tilemap    | Use select tool to select areas of tiles to be moved, copied or deleted, works on tile layers  | OK     |                                                   |
| Tilemap    | Pan and zoom tilemap view                                                                      | OK     |                                                   |
| Tilemap    | Tilemap view is initially rendered with grid centered                                          | OK     |                                                   |
| --------   | ------------------------------------------------------------------------                       | ------ | ----                                              |
| Attributes | Create attributes for painted tile, tile and auto-tile                                         | OK     |                                                   |
| Attributes | The order of importance for attributes in case of collide is tile > auto-tile > painted tile   | OK     |                                                   |
