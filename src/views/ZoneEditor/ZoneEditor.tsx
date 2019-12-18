import React                from 'react';
import { remote, ipcRenderer } from 'electron';
import DatabaseConnection   from '../../data/db';
import { connect }          from 'react-redux';
import { IZoneEditorState } from '../../redux/reducer';
import * as ACTION          from '../../redux/actions';
import SelectZoneModal      from './SelectZoneModal';
import Editor               from './Editor';

// const IN_DEVELOPMENT: boolean = remote.getGlobal('IN_DEVELOPMENT');
// const APP_NAME:       string  = remote.getGlobal('APP_NAME');
// const APP_VERSION:    string  = remote.getGlobal('APP_VERSION');

interface IMapState
{
    zone: string;
}

const mapStateToProps = (state: IZoneEditorState): IMapState => ({
    zone: state.zone
});

interface IMapDispatch
{
    setZone: (zone: string) => void
}

const mapDispatchToProps: IMapDispatch = {
    setZone: (zone) => ({ type: ACTION.SET_ZONE, zone })
}

type IZoneEditorProps = IMapState & IMapDispatch;

interface IZoneEditorComponentState
{
    zonelist: string[];
    selecting_zone: boolean;
}

class ZoneEditor extends React.Component<IZoneEditorProps, IZoneEditorComponentState>
{
    public DB: DatabaseConnection;
    private _window: Electron.BrowserWindow;

    constructor(props: IZoneEditorProps)
    {
        super(props);
        this.state = {
            zonelist: [],
            selecting_zone: false
        }

        this.DB = new DatabaseConnection({
            host:     '127.0.0.1',
            user:     'root',
            password: 'sanchez88',
            database: 'nostalgia_eq'
        });

        this._window = remote.getCurrentWindow();

        this.CloseSelectZoneModal = this.CloseSelectZoneModal.bind(this);
        this.SelectZone = this.SelectZone.bind(this);
    }

    public componentDidMount(): void
    {
        // this.DB.Connect();
        this.ListenForMenuEvents();
    }

    public componentWillUnmount(): void
    {
        // this.DB.End();
    }

    private ListenForMenuEvents(): void
    {
        // ipcRenderer.on('open-zone', () => {
        //     this.ShowSelectZoneModal();
        // });
    }

    private async ShowSelectZoneModal(): Promise<void>
    {
        const zonelist = await this.DB.Zone.List();

        this.setState({ zonelist, selecting_zone: true });
    }

    private CloseSelectZoneModal(): void
    {
        this.setState({ zonelist: [], selecting_zone: false });
    }

    private SelectZone(zone: string): void
    {
        this.CloseSelectZoneModal();
        this.props.setZone(zone);
    }

    public render(): JSX.Element
    {
        return (
            <div>
                <SelectZoneModal
                    selectingZone={this.state.selecting_zone}
                    zonelist={this.state.zonelist} 
                    close={this.CloseSelectZoneModal}
                    selectZone={this.SelectZone}
                />
                {/* {this.props.zone && */}
                <Editor DB={this.DB} />
                {/* } */}
            </div>
        );
    }
}

export default connect<IMapState, IMapDispatch, {}, IZoneEditorState>(mapStateToProps, mapDispatchToProps)(ZoneEditor);
