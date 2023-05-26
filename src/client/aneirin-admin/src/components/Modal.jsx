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
        confirmBtn = <button className="btn confirm" onClick={props.confirmHandler}>{props.confirm}</button>;

    if (typeof (props.cancel) != "undefined")
        cancelBtn = <button className="btn cancel" onClick={props.cancelHandler}>{props.cancel}</button>;

    return (
        <div className={displayed ? "modalContainer" : "modalContainer hidden"} onClick={() => { setDisplay(false) }}>
            <div className="card modal" onClick={e => { e.stopPropagation() }}>
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