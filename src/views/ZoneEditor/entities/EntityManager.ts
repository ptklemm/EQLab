import * as BABYLON from 'babylonjs';
import GraphicsFactory from '../factories/GraphicsFactory';

export default class EntityManager
{
    private scene: BABYLON.Scene;
    private graphics_factory: GraphicsFactory;

    constructor(scene: BABYLON.Scene, graphics_factory: GraphicsFactory)
    {
        this.scene = scene;
        this.graphics_factory = graphics_factory;
    }
}
