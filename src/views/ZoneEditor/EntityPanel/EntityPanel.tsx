import React        from 'react';
import { 
    EQEntity,
    IDoorData,
    IGroundSpawnData, 
    ISpawnData,
    ITrapData
}                   from '../entity/Entity';
import DoorForm     from './DoorForm';
import GroundSpawnForm from './GroundSpawnForm';
import SpawnForm    from './SpawnForm';
import TrapForm     from './TrapForm';

interface IProps
{
    style:                    React.CSSProperties;
    entity:                   EQEntity;
    saveForm:                 (entity_type: string, data: any) => Promise<[boolean, string?]>;
    deleteForm:               () => void;
    resetForm:                () => void;
    closeForm:                () => void;
    handleXChange:            (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleYChange:            (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZChange:            (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleHeadingChange:      (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadiusChange:       (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZDifferenceChange:  (event: React.ChangeEvent<HTMLInputElement>) => void;
    spawngroupExpanded:       boolean;
    toggleSpawngroupExpanded: () => void;
    showRoamCylinder:         boolean;
    toggleRoamCylinder:       (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamDistanceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    showRoamBox:              boolean;
    toggleRoamBox:            (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamLimitsChange:   (min_x: number, max_x: number, min_y: number, max_y: number) => void;
}

class EntityPanel extends React.Component<IProps>
{
    public render(): JSX.Element
    {
        const { entity } = this.props;

        return (
            <React.Fragment>
            {
                this.props.entity.type === EQEntity.TYPE_DOOR &&
                <DoorForm
                    style={this.props.style}
                    entityType={entity.type}
                    entityID={entity.id}
                    initialValues={entity.data as IDoorData}
                    handleXChange={this.props.handleXChange}
                    handleYChange={this.props.handleYChange}
                    handleZChange={this.props.handleZChange}
                    handleHeadingChange={this.props.handleHeadingChange}
                    saveForm={this.props.saveForm}
                    deleteForm={this.props.deleteForm}
                    resetForm={this.props.resetForm}
                    closeForm={this.props.closeForm}
                />
            }
            {
                this.props.entity.type === EQEntity.TYPE_GROUNDSPAWN &&
                <GroundSpawnForm
                    style={this.props.style}
                    entityType={entity.type}
                    entityID={entity.id}
                    initialValues={entity.data as IGroundSpawnData}
                    handleHeadingChange={this.props.handleHeadingChange}
                    saveForm={this.props.saveForm}
                    deleteForm={this.props.deleteForm}
                    resetForm={this.props.resetForm}
                    closeForm={this.props.closeForm}
                />
            }
            {
                this.props.entity.type === EQEntity.TYPE_SPAWN &&
                <SpawnForm
                    style={this.props.style}
                    entityType={entity.type}
                    entityID={entity.id}
                    initialValues={entity.data as ISpawnData}
                    handleXChange={this.props.handleXChange}
                    handleYChange={this.props.handleYChange}
                    handleZChange={this.props.handleZChange}
                    handleHeadingChange={this.props.handleHeadingChange}
                    spawngroupExpanded={this.props.spawngroupExpanded}
                    toggleSpawngroupExpanded={this.props.toggleSpawngroupExpanded}
                    showRoamCylinder={this.props.showRoamCylinder}
                    toggleRoamCylinder={this.props.toggleRoamCylinder}
                    handleRoamDistanceChange={this.props.handleRoamDistanceChange}
                    showRoamBox={this.props.showRoamBox}
                    toggleRoamBox={this.props.toggleRoamBox}
                    handleRoamLimitsChange={this.props.handleRoamLimitsChange}
                    saveForm={this.props.saveForm}
                    deleteForm={this.props.deleteForm}
                    resetForm={this.props.resetForm}
                    closeForm={this.props.closeForm}
                />
            }
            {
                this.props.entity.type === EQEntity.TYPE_TRAP &&
                <TrapForm
                    style={this.props.style}
                    entityType={entity.type}
                    entityID={entity.id}
                    initialValues={entity.data as ITrapData}
                    handleXChange={this.props.handleXChange}
                    handleYChange={this.props.handleYChange}
                    handleZChange={this.props.handleZChange}
                    handleRadiusChange={this.props.handleRadiusChange}
                    handleZDifferenceChange={this.props.handleZDifferenceChange}
                    saveForm={this.props.saveForm}
                    deleteForm={this.props.deleteForm}
                    resetForm={this.props.resetForm}
                    closeForm={this.props.closeForm}
                />
            }
            </React.Fragment>
        );
    }
}

export default EntityPanel;


