import React                 from 'react';
import { Col, Form, Button } from 'react-bootstrap';

const FormGroup = (props) =>
{
    let className;

    if (props.center === 'true' || props.alignstart === 'true')
    {
        className = 'd-flex';

        if (props.center === 'true') { className += ' justify-content-center'; }
        if (props.alignstart === 'true') { className += ' align-items-start'; }
    }

    return (
        <Form.Group
            as={Col}
            md={props.md}
            className={className ? className : null}
            { ...props }
        >
            {props.children}
        </Form.Group>
    );
}

export const Checkbox = ({input, meta, md, ...props}) =>
{
    return (
        <FormGroup md={md} center={props.center} alignstart={props.alignstart} style={{ ...props.style }}>
            <Form.Check type="checkbox" inline checked={input.value} {...input} {...props} />
        </FormGroup>
    );
}

export const Input = ({input, meta, md, ...props}) =>
{
    return (
        <FormGroup md={md} center={props.center} style={{ ...props.style }}>
            <Form.Control
                type="text" 
                size="sm" 
                value={input.value}
                isInvalid={meta.invalid}
                {...input} 
                {...props}
            />
            <Form.Control.Feedback type="invalid">{meta.error}</Form.Control.Feedback>
        </FormGroup>
    );
}

export const Select = ({input, meta, md, ...props}) =>
{
    return (
        <FormGroup md={md} center={props.center} style={{ ...props.style }}>
            <Form.Control as="select" size="sm" value={input.value} {...input} {...props}>
                <option value=""></option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
            </Form.Control>
        </FormGroup>
    );
}
