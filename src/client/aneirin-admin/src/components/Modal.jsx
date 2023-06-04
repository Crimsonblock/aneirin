import { forwardRef, useImperativeHandle, useState } from "react";

export default forwardRef((props, ref) => {
    const [displayed, setDisplay] = useState(false);

    useImperativeHandle(ref, () => ({
        show() {
            setDisplay(true);
        }
    }));

    var title = null;
    if (typeof (props.title) != "undefined")
        title = <h1 className="thin card-title">{props.title}</h1>;

    var confirmBtn = null;
    var cancelBtn = null;

    if (typeof (props.confirm) != "undefined")
        confirmBtn = props.disableConfirm ?
            <button className="btn confirm" disabled onClick={props.confirmHandler}>{props.confirm}</button>
            : <button className="btn confirm" onClick={props.confirmHandler}>{props.confirm}</button>;

    if (typeof (props.cancel) != "undefined")
        cancelBtn = props.disableCancel ?
            <button className="btn cancel" disabled onClick={() => { setDisplay(false); if(typeof(props.cancelHandler) != "undefined") props.cancelHandler() }}>{props.cancel}</button>
            : <button className="btn cancel" onClick={() => { setDisplay(false); if(typeof(props.cancelHandler) != "undefined") props.cancelHandler() }}>{props.cancel}</button>;

    return (
        <div className={displayed ? "modalContainer" : "modalContainer hidden"}>
            <div className="card modal">
                {title}
                {props.children}
                <div className="btnContainer">
                    {confirmBtn}
                    {cancelBtn}
                </div>
            </div>
        </div>
    )
});