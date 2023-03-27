import { AlertOutlined, ExperimentOutlined, HeartOutlined } from '@ant-design/icons';
import { t } from '@lingui/macro';
import _ from 'lodash';
import { Link, useLocation } from 'react-router-dom';

import { extractBundleResources, WithId } from 'aidbox-react/lib/services/fhir';
import { parseFHIRDateTime } from 'aidbox-react/lib/utils/date';

import {
    AidboxResource,
    AllergyIntolerance,
    Appointment,
    Bundle,
    Condition,
    Encounter,
    Immunization,
    MedicationStatement,
    Provenance,
} from 'shared/src/contrib/aidbox';

import { formatHumanDate } from 'src/utils/date';

import medicationIcon from './images/medication.svg';

interface OverviewCard<T = any> {
    title: string;
    icon: React.ReactNode;
    data: T[];
    columns: {
        key: string;
        title: string;
        render: (r: T) => React.ReactNode;
        width?: string | number;
    }[];
    getKey: (r: T) => string;
}

function LinkToEdit(props: {
    name?: string;
    resource: AidboxResource;
    provenanceList: Provenance[];
}) {
    const { name, resource, provenanceList } = props;
    const location = useLocation();
    const provenance = provenanceList.find(
        (p) =>
            p.target[0]?.id === resource.id && p.target[0]?.resourceType === resource.resourceType,
    );
    const entity = provenance?.entity?.[0]?.what;
    const qrId = entity?.uri?.split('/')[1];

    if (qrId) {
        return <Link to={`${location.pathname}/documents/${qrId}`}>{name}</Link>;
    }

    return <>{name}</>;
}

export function prepareAllergies(
    allergies: AllergyIntolerance[],
    provenanceList: Provenance[],
): OverviewCard<AllergyIntolerance> {
    return {
        title: t`Allergies`,
        icon: <ExperimentOutlined />,
        data: allergies,
        getKey: (r: AllergyIntolerance) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (resource: AllergyIntolerance) => (
                    <LinkToEdit
                        name={resource.code?.coding?.[0]?.display}
                        resource={resource}
                        provenanceList={provenanceList}
                    />
                ),
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: AllergyIntolerance) => formatHumanDate(r.meta?.createdAt!),
                width: 200,
            },
        ],
    };
}

export function prepareConditions(
    conditions: Condition[],
    provenanceList: Provenance[],
): OverviewCard<Condition> {
    return {
        title: t`Conditions`,
        icon: <AlertOutlined />,
        data: conditions,
        getKey: (r: Condition) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (resource: Condition) => (
                    <LinkToEdit
                        name={resource.code?.text || resource.code?.coding?.[0]?.display}
                        resource={resource}
                        provenanceList={provenanceList}
                    />
                ),
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: Condition) => formatHumanDate(r.meta?.createdAt!),
                width: 200,
            },
        ],
    };
}

export function prepareImmunizations(
    observations: Immunization[],
    provenanceList: Provenance[],
): OverviewCard<Immunization> {
    return {
        title: t`Immunization`,
        icon: <HeartOutlined />,
        data: observations,
        getKey: (r: Immunization) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (resource: Immunization) => (
                    <LinkToEdit
                        name={resource.vaccineCode.coding?.[0]?.display}
                        resource={resource}
                        provenanceList={provenanceList}
                    />
                ),
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: Immunization) =>
                    r.occurrence?.dateTime ? formatHumanDate(r.occurrence?.dateTime) : '',
                width: 200,
            },
        ],
    };
}

export function prepareMedications(
    observations: MedicationStatement[],
    provenanceList: Provenance[],
): OverviewCard<MedicationStatement> {
    return {
        title: t`Active Medications`,
        // eslint-disable-next-line jsx-a11y/alt-text
        icon: <img src={medicationIcon} />,
        data: observations,
        getKey: (r: MedicationStatement) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (resource: MedicationStatement) => (
                    <LinkToEdit
                        name={resource.medication?.CodeableConcept?.coding?.[0]?.display}
                        resource={resource}
                        provenanceList={provenanceList}
                    />
                ),
            },
            {
                title: t`Dosage`,
                key: 'date',
                render: (r: MedicationStatement) =>
                    r.dosage?.[0]?.text ? r.dosage?.[0]?.text : '',
                width: 200,
            },
        ],
    };
}

export function prepareAppointments(bundle: Bundle<WithId<Appointment | Encounter>>) {
    const appointments = extractBundleResources(bundle).Appointment;
    const appointmentsWithEncounter = extractBundleResources(bundle).Encounter.map(
        (e) => e.appointment?.[0]?.id,
    );

    return appointments.filter((a) => !appointmentsWithEncounter.includes(a.id));
}

export function prepareAppointmentDetails(appointment: Appointment) {
    const [name, specialty] =
        appointment.participant
            .find((p) => p.actor?.resourceType === 'PractitionerRole')
            ?.actor?.display?.split(' - ') || [];
    const appointmentDetails = [
        {
            title: t`Practitioner`,
            value: name || '-',
        },
        {
            title: t`Service`,
            value: specialty || '-',
        },
        {
            title: t`Date`,
            value: appointment.start ? formatHumanDate(appointment.start) : '-',
        },
        {
            title: t`Time`,
            value: _.compact([
                appointment.start
                    ? parseFHIRDateTime(appointment.start).format('HH:mm')
                    : undefined,
                appointment.end ? parseFHIRDateTime(appointment.end).format('HH:mm') : undefined,
            ]).join('–'),
        },
    ];

    return appointmentDetails;
}
