# System tests

| Context  | Test                                                                          | Status | Info |
| -------- | ----------------------------------------------------------------------------- | ------ | ---- |
| Project  | Can create new project which wipes any current work                           |        |      |
| Project  | Can load a project from file                                                  |        |      |
| Project  | Can download project to file                                                  |        |      |
| Project  | Can export project as JSON                                                    |        |      |
| -------- | ------------------------------------------------------------------------      | ------ | ---- |
| Settings | Can toggle show grid                                                          |        |      |
| Settings | Can change tilesizes 16, 32, 48, 64                                           |        |      |
| Settings | Can change width and height                                                   |        |      |
| Settings | Maximum width and height in tiles is 250 tiles                                |        |      |
| Settings | Can change project name                                                       |        |      |
| Settings | Can change grid color                                                         |        |      |
| -------- | -------------------------------------------------------------------------     | ------ | ---- |
| Layers   | Create layer                                                                  |        |      |
| Layers   | Edit name of layer                                                            |        |      |
| Layers   | Delete layer                                                                  |        |      |
| Layers   | Toggle visibility for layer, only visble layers are displayed on tilemap      |        |      |
| Layers   | Drag do reorder layers, layers are rendered in their order                    |        |      |
| Layers   | Different types of layers, tile, auto tile and area are shown as icon/tooltip |        |      |
| -------- | ------------------------------------------------------------------------      | ------ | ---- |
| Tilesets | Can't rename tileset to a name that already exists                            |        |      |
| Tilesets | Delete tileset                                                                |        |      |
| Tilesets | Can't delete tileset that is used in auto tile or tilemap                     |        |      |
| Tilesets | Select tiles to paint with in tileset by selecting area on canvas             |        |      |
| Tilesets | Selected tiles can only be painted on tile layers                             |        |      |
| Tilesets | Upload tileset in any image format                                            |        |      |
| Tilesets | Uploaded tileset is named after filename                                      |        |      |
| Tilesets | If tileset with filename already exists the name is suffixed with (n)         |        |      |
| Tilesets | Rename tileset                                                                |        |      |
| Tilesets | Can't rename tileset to a name that already exists                            |        |      |
| Tilesets | Delete tileset                                                                |        |      |
| Tilesets | Can't delete tileset that is used in auto tile or tilemap                     |        |      |
| Tilesets | Select tiles to paint with in tileset by selecting area on canvas             |        |      |
| Tilesets | Selected tiles can only be painted on tile layers                             |        |      |
| -------- | ------------------------------------------------------------------------      | ------ | ---- |
| Areas    | Create area                                                                   |        |      |
| Areas    | Edit area                                                                     |        |      |
| Areas    | Delete area                                                                   |        |      |
| Areas    | Areas can't have the same name                                                |        |      |
| Areas    | Area that is used in tilemap can't be deleted                                 |        |      |
| Areas    | Select area in list of areas to paint with on tilemap                         |        |      |
| Areas    | Areas can only be painted on area layers                                      |        |      |
| -------- | ------------------------------------------------------------------------      | ------ | ---- |
| Autotile | Create auto tile                                                              |        |      |
| Autotile | Edit auto tile                                                                |        |      |
| Autotile | Autotile requires a default tile and name, each tile rule has to have a tile  |        |      |
| Autotile | Create a tile rule by selecting connections and choosing a tile               |        |      |
| Autotile | Use fast buttons to generate tile rules with preset connections               |        |      |
| Autotile | Delete auto tile                                                              |        |      |
| Autotile | Auto tiles can't be deleted if they are used in tilemap                       |        |      |
| -------- | ------------------------------------------------------------------------      | ------ | ---- |
| Tilemap  | Paint with 1 or more tiles                                                    |        |      |
| Tilemap  | Paint with area                                                               |        |      |
| Tilemap  | Paint with an auto tile and see how the neighbours update according to rules  |        |      |
| Tilemap  | Use fill tool for the above                                                   |        |      |
| Tilemap  | Use select tool to select areas of tiles to be moved, copied or deleted       |        |      |
| Tilemap  | Pan and zoom tilemap view                                                     |        |      |
| Tilemap  | Tilemap view is initially rendered with grid centered                         |        |      |
