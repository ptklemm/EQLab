import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { EQEntity, ISpawnData } from '../entity/Entity';
import SpawnForm from './SpawnForm';

interface IProps
{
    style: React.CSSProperties;
    entity: EQEntity;
    saveForm: (entity_type: string, data: any) => void;
    resetForm: () => void;
    closeForm: () => void;
    handleXChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleYChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleZChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleHeadingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    spawngroupExpanded: boolean;
    toggleSpawngroupExpanded: () => void;
    showRoamCylinder: boolean;
    toggleRoamCylinder: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamDistanceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    showRoamBox: boolean;
    toggleRoamBox: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoamLimitsChange: (min_x: number, max_x: number, min_y: number, max_y: number) => void;
}

class EntityPanel extends React.Component<IProps>
{
    public render(): JSX.Element
    {
        const { entity } = this.props;

        return (
            <React.Fragment>
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
                    resetForm={this.props.resetForm}
                    closeForm={this.props.closeForm}
                />
            }
            </React.Fragment>
        );
    }
}

export default EntityPanel;


