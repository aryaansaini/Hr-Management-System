'use client';

import { useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';

import {
    getAllEmployees,
    searchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from '@/lib/adminApi';

import toast from 'react-hot-toast';

import {
    FaEye,
    FaEyeSlash,
} from 'react-icons/fa';

import {
    Users,
    AlertTriangle,
    Loader2,
    Search,
    Plus,
    X,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    UserCog,
    UserRound,
} from 'lucide-react';


/* =========================================================
   BADGE
========================================================= */

function Badge({ status }) {
    const normalizedStatus = String(status || 'EMPLOYEE')
        .replace(/^ROLE_/i, '')
        .toUpperCase();

    const badgeStyles = {
        ACTIVE:
            'bg-green-100 text-green-700 border-green-200 dark:bg-[#173404] dark:text-[#97C459] dark:border-[#27500A]',

        INACTIVE:
            'bg-red-100 text-red-700 border-red-200 dark:bg-[#4A1313] dark:text-[#F09595] dark:border-[#791F1F]',

        ADMIN:
            'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-[#0C447C] dark:text-[#B5D4F4] dark:border-[#185FA5]',

        HR:
            'bg-purple-100 text-purple-700 border-purple-200 dark:bg-[#3C3489] dark:text-[#CECBF6] dark:border-[#534AB7]',

        EMPLOYEE:
            'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1B2740] dark:text-[#B5D4F4] dark:border-[#223148]',
    };

    return (
        <span
            className={`
                inline-flex
                items-center
                justify-center
                whitespace-nowrap
                px-2.5
                py-1
                rounded-full
                text-[11px]
                font-bold
                border
                shrink-0
                ${badgeStyles[normalizedStatus] || badgeStyles.EMPLOYEE}
            `}
        >
            {normalizedStatus}
        </span>
    );
}


/* =========================================================
   INPUT CLASS
========================================================= */

const INPUT_CLASS = `
    w-full
    min-w-0
    px-3
    py-2.5
    rounded-lg
    text-[13px]
    outline-none
    box-border
    bg-white
    border
    border-slate-200
    text-slate-900
    placeholder-slate-400
    dark:bg-[#111A2C]
    dark:border-[#223148]
    dark:text-[#E6F1FB]
    dark:placeholder-[#5F7590]
    focus:border-indigo-500
    dark:focus:border-[#378ADD]
    transition-colors
    [&::-ms-reveal]:hidden
    [&::-ms-clear]:hidden
`;


/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
    label,
    name,
    type = 'text',
    required = false,
    placeholder,
    value,
    onChange,
    max,
    maxLength,
    numericOnly = false,
    inputClassName = '',
}) {
    return (
        <div className="min-w-0">
            <label
                className="
                    block
                    mb-1.5
                    text-xs
                    font-semibold
                    text-slate-700
                    dark:text-[#B5D4F4]
                "
            >
                {label}

                {required && (
                    <span className="text-red-500 dark:text-[#F09595]">
                        {' '}*
                    </span>
                )}
            </label>

            <input
                type={type}
                value={value || ''}
                placeholder={placeholder}
                required={required}
                max={max}
                maxLength={maxLength}
                inputMode={numericOnly ? 'numeric' : undefined}
                className={`${INPUT_CLASS} ${inputClassName}`}
                onChange={(event) => {
                    let newValue = event.target.value;

                    if (numericOnly) {
                        newValue = newValue.replace(/[^0-9]/g, '');
                    }

                    if (maxLength) {
                        newValue = newValue.slice(0, maxLength);
                    }

                    onChange(name, newValue);
                }}
                onKeyDown={(event) => {
                    if (
                        numericOnly &&
                        !/[0-9]/.test(event.key) &&
                        ![
                            'Backspace',
                            'Delete',
                            'ArrowLeft',
                            'ArrowRight',
                            'Tab',
                            'Home',
                            'End',
                        ].includes(event.key)
                    ) {
                        event.preventDefault();
                    }
                }}
            />
        </div>
    );
}


/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    basicSalary: '',
    dateOfJoining: '',
    dateOfBirth: '',
    role: 'EMPLOYEE',
};


/* =========================================================
   MAIN PAGE
========================================================= */

export default function EmployeeManagementPage() {

    /* =====================================================
       EMPLOYEE STATE
    ===================================================== */

    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);

    const [searching, setSearching] = useState(false);

    const [search, setSearch] = useState('');

    const [page, setPage] = useState(0);

    const [totalPages, setTotalPages] = useState(0);

    const [totalElements, setTotalElements] = useState(0);


    /* =====================================================
       FORM STATE
    ===================================================== */

    const [showForm, setShowForm] = useState(false);

    const [editMode, setEditMode] = useState(false);

    const [editId, setEditId] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [submitting, setSubmitting] = useState(false);

    const [showPassword, setShowPassword] = useState(false);


    /* =====================================================
       DELETE STATE
    ===================================================== */

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(null);

    const [deleting, setDeleting] = useState(null);


    /* =====================================================
       CURRENT USER ROLE
       
       Supports:
       ADMIN
       ROLE_ADMIN
       HR
       ROLE_HR
       HR_MANAGER
       ROLE_HR_MANAGER
       HUMAN_RESOURCE
       HUMANRESOURCE

       The original implementation only checked:
       state.auth.user.role

       This version safely handles the common Redux
       authority structures as well.
    ===================================================== */

    const rawUserRole = useSelector(
        (state) =>
            state.auth?.user?.role ||
            state.auth?.user?.roleName ||
            state.auth?.user?.authority ||
            state.auth?.user?.authorities?.[0]?.authority ||
            state.auth?.user?.authorities?.[0] ||
            ''
    );

    const normalizedUserRole = String(rawUserRole || '')
        .replace(/^ROLE_/i, '')
        .trim()
        .toUpperCase();

    const currentUserRole =
        normalizedUserRole.includes('ADMIN')
            ? 'ADMIN'
            : normalizedUserRole === 'HR' ||
                normalizedUserRole.includes('HR_MANAGER') ||
                normalizedUserRole.includes('HRMANAGER') ||
                normalizedUserRole.includes('HUMAN_RESOURCE') ||
                normalizedUserRole.includes('HUMANRESOURCE')
                ? 'HR'
                : normalizedUserRole || 'EMPLOYEE';

    const isAdmin = currentUserRole === 'ADMIN';

    const isHR = currentUserRole === 'HR';


    /* =====================================================
       TABLE COLUMNS
    ===================================================== */

    const tableColumns =
        '88px minmax(190px, 2fr) minmax(120px, 1.2fr) minmax(140px, 1.2fr) 120px 115px 142px';


    /* =====================================================
       SORT EMPLOYEES
    ===================================================== */

    const sortEmployees = useCallback((list) => {
        return [...list].sort((a, b) => {
            const empA = parseInt(
                String(a.employeeId || '')
                    .replace(/^EMP/i, ''),
                10
            );

            const empB = parseInt(
                String(b.employeeId || '')
                    .replace(/^EMP/i, ''),
                10
            );

            return (
                (Number.isNaN(empA) ? 0 : empA) -
                (Number.isNaN(empB) ? 0 : empB)
            );
        });
    }, []);


    /* =====================================================
       GET ALL EMPLOYEES
    ===================================================== */

    const fetchEmployees = useCallback(async () => {
        setLoading(true);

        try {
            const response = await getAllEmployees(
                page,
                10
            );

            const data = response?.data?.data;

            const content = data?.content || [];

            setEmployees(sortEmployees(content));

            setTotalPages(
                Number(data?.totalPages || 0)
            );

            setTotalElements(
                Number(data?.totalElements || 0)
            );

        } catch (error) {
            console.error(
                'Fetch employees error:',
                error
            );

            toast.error(
                error?.response?.data?.message ||
                'Failed to load employees'
            );

        } finally {
            setLoading(false);
        }
    }, [
        page,
        sortEmployees,
    ]);


    /* =====================================================
       SEARCH EMPLOYEES
    ===================================================== */

    const performSearch = useCallback(async () => {

        if (!search.trim()) {
            return;
        }

        setSearching(true);

        try {
            const response = await searchEmployees(
                search.trim(),
                page,
                10
            );

            const data = response?.data?.data;

            const content = data?.content || [];

            setEmployees(sortEmployees(content));

            setTotalPages(
                Number(data?.totalPages || 0)
            );

            setTotalElements(
                Number(data?.totalElements || 0)
            );

        } catch (error) {
            console.error(
                'Search employees error:',
                error
            );

            toast.error(
                error?.response?.data?.message ||
                'Search failed'
            );

        } finally {
            setSearching(false);
        }

    }, [
        search,
        page,
        sortEmployees,
    ]);


    /* =====================================================
       LOAD DATA
    ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {

            if (search.trim()) {
                performSearch();
            } else {
                fetchEmployees();
            }

        }, search.trim() ? 400 : 0);

        return () => {
            clearTimeout(timer);
        };

    }, [
        search,
        page,
        fetchEmployees,
        performSearch,
    ]);


    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleFieldChange = (
        name,
        value
    ) => {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    /* =====================================================
       OPEN ADD FORM
    ===================================================== */

    const openAddForm = () => {
        setEditMode(false);

        setEditId(null);

        setForm({
            ...EMPTY_FORM,
        });

        setShowPassword(false);

        setShowForm(true);
    };


    /* =====================================================
       OPEN EDIT FORM
    ===================================================== */

    const openEditForm = (employee) => {

        setEditMode(true);

        setEditId(employee.id);

        setForm({
            employeeId:
                employee.employeeId || '',

            firstName:
                employee.firstName || '',

            lastName:
                employee.lastName || '',

            email:
                employee.email || '',

            password: '',

            phone:
                employee.phone || '',

            department:
                employee.department || '',

            designation:
                employee.designation || '',

            basicSalary:
                employee.basicSalary ?? '',

            dateOfJoining:
                employee.dateOfJoining || '',

            dateOfBirth:
                employee.dateOfBirth || '',

            role:
                String(employee.role || 'EMPLOYEE')
                    .replace(/^ROLE_/i, '')
                    .toUpperCase(),
        });

        setShowPassword(false);

        setShowForm(true);
    };


    /* =====================================================
       CLOSE FORM
    ===================================================== */

    const closeForm = () => {
        if (submitting) {
            return;
        }

        setShowForm(false);

        setEditMode(false);

        setEditId(null);

        setForm({
            ...EMPTY_FORM,
        });

        setShowPassword(false);
    };


    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (
            form.phone &&
            form.phone.length !== 10
        ) {
            toast.error(
                'Phone number must be exactly 10 digits'
            );

            return;
        }

        if (
            !editMode &&
            (!form.password ||
                form.password.length < 8)
        ) {
            toast.error(
                'Password must be at least 8 characters'
            );

            return;
        }

        setSubmitting(true);

        try {

            const payload = {
                ...form,

                basicSalary:
                    form.basicSalary !== ''
                        ? parseFloat(
                            form.basicSalary
                        )
                        : 0,
            };


            if (editMode) {

                if (!payload.password) {
                    delete payload.password;
                }

                await updateEmployee(
                    editId,
                    payload
                );

                toast.success(
                    'Employee updated successfully!'
                );

            } else {

                await createEmployee(
                    payload
                );

                toast.success(
                    'Employee created successfully!'
                );
            }


            setShowForm(false);

            setEditMode(false);

            setEditId(null);

            setForm({
                ...EMPTY_FORM,
            });

            setShowPassword(false);

            await fetchEmployees();

        } catch (error) {

            console.error(
                'Employee save error:',
                error
            );

            toast.error(
                error?.response?.data?.message ||
                'Operation failed'
            );

        } finally {
            setSubmitting(false);
        }
    };


    /* =====================================================
       DELETE
       
       IMPORTANT:
       Only ADMIN can delete.

       HR never reaches the API because the button is
       hidden and this additional guard protects the
       handler as well.
    ===================================================== */

    const handleDelete = async (employee) => {

        const employeeId =
            employee?.id ??
            employee?.employeeId;

        if (!employeeId) {

            console.error(
                'Delete failed: Employee ID is missing',
                employee
            );

            toast.error(
                'Unable to delete employee: Employee ID is missing.'
            );

            return;
        }


        /* -----------------------------------------------
           ADMIN ONLY
        ------------------------------------------------ */

        if (!isAdmin) {

            toast.error(
                "You don't have permission to delete employees. Only Admin can delete employees.",
                {
                    duration: 5000,
                }
            );

            setShowDeleteConfirm(null);

            return;
        }


        setDeleting(employeeId);

        try {

            await deleteEmployee(
                employeeId
            );

            toast.success(
                'Employee deleted successfully!'
            );

            setShowDeleteConfirm(null);

            await fetchEmployees();

        } catch (error) {

            console.error(
                'Delete employee error:',
                error
            );


            if (
                error?.response?.status === 403
            ) {

                toast.error(
                    "You don't have permission to delete employees. Only Admin can delete employees.",
                    {
                        duration: 5000,
                    }
                );

                return;
            }


            if (
                error?.response?.status === 401
            ) {

                toast.error(
                    'Your session has expired. Please login again.',
                    {
                        duration: 5000,
                    }
                );

                return;
            }


            toast.error(
                error?.response?.data?.message ||
                'Failed to delete employee. Please try again.',
                {
                    duration: 5000,
                }
            );

        } finally {

            setDeleting(null);
        }
    };


    /* =====================================================
       DATE OF BIRTH MAX
    ===================================================== */

    const today = new Date()
        .toISOString()
        .split('T')[0];


    /* =====================================================
       INITIALS
    ===================================================== */

    const getInitials = (employee) => {

        const first =
            employee?.firstName?.trim()?.[0] ||
            '';

        const last =
            employee?.lastName?.trim()?.[0] ||
            '';

        return (
            `${first}${last}` ||
            'U'
        ).toUpperCase();
    };


    /* =====================================================
       ROLE ICON
    ===================================================== */

    const RoleIcon = ({
        role,
        size = 14,
    }) => {

        const normalized =
            String(role || '')
                .replace(/^ROLE_/i, '')
                .toUpperCase();

        if (normalized === 'ADMIN') {
            return (
                <ShieldCheck
                    size={size}
                />
            );
        }

        if (normalized === 'HR') {
            return (
                <UserCog
                    size={size}
                />
            );
        }

        return (
            <UserRound
                size={size}
            />
        );
    };


    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div
            className="
                w-full
                min-w-0
                max-w-full
                min-h-screen
                overflow-x-hidden
                box-border
                p-4
                sm:p-6
                lg:p-7
                bg-slate-50
                text-slate-900
                dark:bg-[#0B1220]
                dark:text-[#E6F1FB]
                transition-colors
            "
        >

            <div
                className="
                    w-full
                    max-w-[1600px]
                    mx-auto
                "
            >

                {/* =================================================
                   HEADER
                ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                        gap-5
                        mb-7
                    "
                >

                    <div className="min-w-0">

                        <div
                            className="
                                inline-flex
                                items-center
                                gap-2
                                mb-2
                                px-2.5
                                py-1
                                rounded-full
                                border
                                bg-indigo-50
                                border-indigo-100
                                text-indigo-600
                                dark:bg-[#111F35]
                                dark:border-[#223A5A]
                                dark:text-[#72B6F8]
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                            "
                        >
                            <span
                                className="
                                    w-1.5
                                    h-1.5
                                    rounded-full
                                    bg-indigo-500
                                    dark:bg-[#5BAAF5]
                                "
                            />

                            {isAdmin
                                ? 'Admin Management'
                                : isHR
                                    ? 'HR Management'
                                    : 'Employee Directory'}
                        </div>


                        <h1
                            className="
                                text-[25px]
                                sm:text-[28px]
                                lg:text-[30px]
                                font-extrabold
                                tracking-tight
                                truncate
                                text-slate-900
                                dark:text-[#F3F8FD]
                            "
                        >
                            Employee Management
                        </h1>


                        <p
                            className="
                                mt-1.5
                                text-[13px]
                                sm:text-[14px]
                                text-slate-500
                                dark:text-[#7C93B3]
                            "
                        >
                            Manage employee records, roles,
                            departments and access.
                        </p>

                    </div>


                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            shrink-0
                        "
                    >

                        <div
                            className="
                                hidden
                                sm:flex
                                items-center
                                gap-2
                                px-3.5
                                py-2.5
                                rounded-xl
                                border
                                bg-white
                                border-slate-200
                                text-slate-600
                                dark:bg-[#0F1728]
                                dark:border-[#1B2740]
                                dark:text-[#B5D4F4]
                                text-xs
                                font-semibold
                            "
                        >
                            <Users
                                size={15}
                            />

                            {totalElements}
                            {' '}
                            Employees
                        </div>


                        <button
                            type="button"
                            onClick={openAddForm}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                shrink-0
                                px-5
                                py-2.5
                                rounded-xl
                                text-[13px]
                                font-bold
                                whitespace-nowrap
                                cursor-pointer
                                bg-indigo-600
                                text-white
                                hover:bg-indigo-700
                                dark:bg-[#378ADD]
                                dark:hover:bg-[#4A9BEA]
                                dark:text-[#042C53]
                                shadow-sm
                                hover:shadow-md
                                transition-all
                            "
                        >
                            <Plus
                                size={16}
                            />

                            Add Employee
                        </button>

                    </div>

                </div>


                {/* =================================================
                   SUMMARY CARDS
                ================================================= */}

                <div
                    className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        lg:grid-cols-4
                        gap-3
                        mb-5
                    "
                >

                    <div
                        className="
                            rounded-2xl
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                            p-4
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-400
                                        dark:text-[#6F86A3]
                                    "
                                >
                                    Total Employees
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xl
                                        font-extrabold
                                        text-slate-900
                                        dark:text-[#F3F8FD]
                                    "
                                >
                                    {totalElements}
                                </p>
                            </div>

                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-indigo-50
                                    text-indigo-600
                                    dark:bg-[#132B49]
                                    dark:text-[#72B6F8]
                                "
                            >
                                <Users
                                    size={18}
                                />
                            </div>

                        </div>
                    </div>


                    <div
                        className="
                            rounded-2xl
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                            p-4
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-400
                                        dark:text-[#6F86A3]
                                    "
                                >
                                    Current Page
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xl
                                        font-extrabold
                                        text-slate-900
                                        dark:text-[#F3F8FD]
                                    "
                                >
                                    {page + 1}
                                </p>
                            </div>

                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-purple-50
                                    text-purple-600
                                    dark:bg-[#292452]
                                    dark:text-[#A9A3F5]
                                "
                            >
                                <ChevronRight
                                    size={18}
                                />
                            </div>

                        </div>
                    </div>


                    <div
                        className="
                            rounded-2xl
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                            p-4
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-400
                                        dark:text-[#6F86A3]
                                    "
                                >
                                    Pages
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xl
                                        font-extrabold
                                        text-slate-900
                                        dark:text-[#F3F8FD]
                                    "
                                >
                                    {totalPages || 0}
                                </p>
                            </div>

                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-amber-50
                                    text-amber-600
                                    dark:bg-[#332711]
                                    dark:text-[#F2B94B]
                                "
                            >
                                <ChevronRight
                                    size={18}
                                />
                            </div>

                        </div>
                    </div>


                    <div
                        className="
                            rounded-2xl
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                            p-4
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-400
                                        dark:text-[#6F86A3]
                                    "
                                >
                                    Access Level
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xl
                                        font-extrabold
                                        text-slate-900
                                        dark:text-[#F3F8FD]
                                    "
                                >
                                    {isAdmin
                                        ? 'Admin'
                                        : isHR
                                            ? 'HR'
                                            : 'Employee'}
                                </p>
                            </div>

                            <div
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-green-50
                                    text-green-600
                                    dark:bg-[#173404]
                                    dark:text-[#97C459]
                                "
                            >
                                <ShieldCheck
                                    size={18}
                                />
                            </div>

                        </div>
                    </div>

                </div>


                {/* =================================================
                   SEARCH
                ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-3
                        mb-5
                    "
                >

                    <div
                        className="
                            relative
                            w-full
                            sm:max-w-[500px]
                            min-w-0
                        "
                    >

                        <Search
                            size={17}
                            className="
                                absolute
                                left-3.5
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                                dark:text-[#5F7590]
                                pointer-events-none
                            "
                        />

                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(
                                    event.target.value
                                );

                                setPage(0);
                            }}
                            placeholder="
                                Search by name, email,
                                department or designation...
                            "
                            className="
                                w-full
                                h-11
                                pl-10
                                pr-11
                                rounded-xl
                                text-[13px]
                                outline-none
                                box-border
                                bg-white
                                border
                                border-slate-200
                                text-slate-900
                                placeholder-slate-400
                                dark:bg-[#111A2C]
                                dark:border-[#223148]
                                dark:text-[#E6F1FB]
                                dark:placeholder-[#5F7590]
                                focus:border-indigo-500
                                dark:focus:border-[#378ADD]
                                transition-colors
                            "
                        />

                        {searching && (
                            <Loader2
                                size={16}
                                className="
                                    absolute
                                    right-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    animate-spin
                                    text-indigo-500
                                    dark:text-[#5BAAF5]
                                "
                            />
                        )}

                        {!searching &&
                            search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setPage(0);
                                    }}
                                    className="
                                        absolute
                                        right-3
                                        top-1/2
                                        -translate-y-1/2
                                        p-1
                                        rounded-md
                                        text-slate-400
                                        hover:text-slate-700
                                        dark:text-[#6F86A3]
                                        dark:hover:text-[#D7E6F5]
                                        cursor-pointer
                                    "
                                >
                                    <X
                                        size={15}
                                    />
                                </button>
                            )}

                    </div>


                    {search && (
                        <p
                            className="
                                text-xs
                                text-slate-500
                                dark:text-[#7C93B3]
                            "
                        >
                            Searching for:
                            {' '}
                            <span
                                className="
                                    font-semibold
                                    text-slate-700
                                    dark:text-[#B5D4F4]
                                "
                            >
                                &quot;{search}&quot;
                            </span>
                        </p>
                    )}

                </div>


                {/* =================================================
                   TABLE CONTAINER
                ================================================= */}

                <div
                    className="
                        w-full
                        min-w-0
                        max-w-full
                        overflow-hidden
                        rounded-2xl
                        border
                        bg-white
                        border-slate-200
                        dark:bg-[#0F1728]
                        dark:border-[#1B2740]
                        shadow-sm
                        dark:shadow-none
                    "
                >

                    {/* TABLE HEADER */}

                    <div
                        className="
                            hidden
                            md:grid
                            gap-3
                            px-5
                            py-3.5
                            border-b
                            bg-slate-50
                            border-slate-200
                            dark:bg-[#0B1220]
                            dark:border-[#1B2740]
                        "
                        style={{
                            gridTemplateColumns:
                                tableColumns,
                        }}
                    >

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            EMP ID
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            EMPLOYEE
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            DEPARTMENT
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            DESIGNATION
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            ROLE
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            STATUS
                        </div>

                        <div className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-500
                            dark:text-[#7C93B3]
                        ">
                            ACTIONS
                        </div>

                    </div>


                    {/* LOADING */}

                    {loading ? (

                        <div
                            className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                py-20
                                text-sm
                                text-slate-400
                                dark:text-[#5F7590]
                            "
                        >
                            <Loader2
                                size={28}
                                className="
                                    animate-spin
                                    mb-3
                                    text-indigo-500
                                    dark:text-[#5BAAF5]
                                "
                            />

                            Loading employees...
                        </div>

                    ) : employees.length === 0 ? (

                        /* =========================================
                           EMPTY STATE
                        ========================================== */

                        <div
                            className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                py-20
                                px-5
                                text-center
                            "
                        >

                            <div
                                className="
                                    w-16
                                    h-16
                                    rounded-2xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-slate-100
                                    text-slate-400
                                    dark:bg-[#111A2C]
                                    dark:text-[#5F7590]
                                    mb-4
                                "
                            >
                                <Users
                                    size={30}
                                    strokeWidth={1.5}
                                />
                            </div>

                            <p
                                className="
                                    text-[16px]
                                    font-bold
                                    text-slate-900
                                    dark:text-[#E6F1FB]
                                "
                            >
                                {search
                                    ? 'No employees found'
                                    : 'No employees yet'}
                            </p>

                            <p
                                className="
                                    mt-1.5
                                    text-[13px]
                                    text-slate-500
                                    dark:text-[#7C93B3]
                                "
                            >
                                {search
                                    ? `No results for "${search}"`
                                    : 'Add your first employee to get started.'}
                            </p>

                            {!search && (
                                <button
                                    type="button"
                                    onClick={openAddForm}
                                    className="
                                        mt-5
                                        inline-flex
                                        items-center
                                        gap-2
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        text-xs
                                        font-bold
                                        bg-indigo-600
                                        text-white
                                        hover:bg-indigo-700
                                        dark:bg-[#378ADD]
                                        dark:text-[#042C53]
                                        cursor-pointer
                                    "
                                >
                                    <Plus
                                        size={15}
                                    />

                                    Add Employee
                                </button>
                            )}

                        </div>

                    ) : (

                        /* =========================================
                           EMPLOYEE ROWS
                        ========================================== */

                        <div className="w-full min-w-0">

                            {employees.map(
                                (employee) => (

                                    <div
                                        key={
                                            employee.id ??
                                            employee.employeeId
                                        }
                                        className="
                                            border-b
                                            border-slate-100
                                            dark:border-[#1B2740]
                                            last:border-b-0
                                        "
                                    >

                                        {/* =================================
                                           DESKTOP ROW
                                        ================================== */}

                                        <div
                                            className="
                                                hidden
                                                md:grid
                                                gap-3
                                                items-center
                                                px-5
                                                py-3.5
                                                min-w-0
                                                w-full
                                                hover:bg-slate-50
                                                dark:hover:bg-[#111A2C]
                                                transition-colors
                                            "
                                            style={{
                                                gridTemplateColumns:
                                                    tableColumns,
                                            }}
                                        >

                                            {/* EMP ID */}

                                            <div
                                                className="
                                                    min-w-0
                                                    overflow-hidden
                                                    whitespace-nowrap
                                                    text-ellipsis
                                                    text-xs
                                                    font-semibold
                                                    text-slate-500
                                                    dark:text-[#7C93B3]
                                                "
                                                title={
                                                    employee.employeeId
                                                }
                                            >
                                                {
                                                    employee.employeeId ||
                                                    '—'
                                                }
                                            </div>


                                            {/* EMPLOYEE */}

                                            <div
                                                className="
                                                    min-w-0
                                                    flex
                                                    items-center
                                                    gap-2.5
                                                "
                                            >

                                                <div
                                                    className="
                                                        shrink-0
                                                        w-9
                                                        h-9
                                                        rounded-full
                                                        flex
                                                        items-center
                                                        justify-center
                                                        text-xs
                                                        font-bold
                                                        bg-[#185FA5]
                                                        text-white
                                                        ring-2
                                                        ring-indigo-50
                                                        dark:ring-[#132B49]
                                                    "
                                                >
                                                    {getInitials(
                                                        employee
                                                    )}
                                                </div>


                                                <div
                                                    className="
                                                        min-w-0
                                                        flex-1
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            min-w-0
                                                            overflow-hidden
                                                            whitespace-nowrap
                                                            text-ellipsis
                                                            text-[13px]
                                                            font-semibold
                                                            text-slate-900
                                                            dark:text-[#E6F1FB]
                                                        "
                                                        title={`
                                                            ${employee.firstName || ''}
                                                            ${employee.lastName || ''}
                                                        `}
                                                    >
                                                        {
                                                            employee.firstName
                                                        }
                                                        {' '}
                                                        {
                                                            employee.lastName
                                                        }
                                                    </div>

                                                    <div
                                                        className="
                                                            min-w-0
                                                            overflow-hidden
                                                            whitespace-nowrap
                                                            text-ellipsis
                                                            text-[11px]
                                                            text-slate-500
                                                            dark:text-[#5F7590]
                                                        "
                                                        title={
                                                            employee.email
                                                        }
                                                    >
                                                        {
                                                            employee.email ||
                                                            '—'
                                                        }
                                                    </div>

                                                </div>

                                            </div>


                                            {/* DEPARTMENT */}

                                            <div
                                                className="
                                                    min-w-0
                                                    overflow-hidden
                                                    whitespace-nowrap
                                                    text-ellipsis
                                                    text-[13px]
                                                    text-slate-700
                                                    dark:text-[#B5D4F4]
                                                "
                                                title={
                                                    employee.department ||
                                                    '—'
                                                }
                                            >
                                                {
                                                    employee.department ||
                                                    '—'
                                                }
                                            </div>


                                            {/* DESIGNATION */}

                                            <div
                                                className="
                                                    min-w-0
                                                    overflow-hidden
                                                    whitespace-nowrap
                                                    text-ellipsis
                                                    text-[13px]
                                                    text-slate-700
                                                    dark:text-[#B5D4F4]
                                                "
                                                title={
                                                    employee.designation ||
                                                    '—'
                                                }
                                            >
                                                {
                                                    employee.designation ||
                                                    '—'
                                                }
                                            </div>


                                            {/* ROLE */}

                                            <div
                                                className="
                                                    min-w-0
                                                    overflow-hidden
                                                "
                                            >
                                                <div
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                    "
                                                >
                                                    <RoleIcon
                                                        role={
                                                            employee.role
                                                        }
                                                        size={12}
                                                    />

                                                    <Badge
                                                        status={
                                                            employee.role
                                                        }
                                                    />
                                                </div>
                                            </div>


                                            {/* STATUS */}

                                            <div
                                                className="
                                                    min-w-0
                                                    overflow-hidden
                                                "
                                            >
                                                <Badge
                                                    status={
                                                        employee.active
                                                            ? 'ACTIVE'
                                                            : 'INACTIVE'
                                                    }
                                                />
                                            </div>


                                            {/* ACTIONS */}

                                            <div
                                                className="
                                                    min-w-0
                                                    flex
                                                    items-center
                                                    gap-1.5
                                                    overflow-hidden
                                                "
                                            >

                                                {/* EDIT — AVAILABLE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(
                                                            employee
                                                        )
                                                    }
                                                    className="
                                                        shrink-0
                                                        inline-flex
                                                        items-center
                                                        justify-center
                                                        gap-1.5
                                                        px-3
                                                        py-1.5
                                                        rounded-lg
                                                        text-[11px]
                                                        font-bold
                                                        whitespace-nowrap
                                                        cursor-pointer
                                                        bg-blue-600
                                                        text-white
                                                        hover:bg-blue-700
                                                        dark:bg-[#185FA5]
                                                        dark:hover:bg-[#2171C2]
                                                        transition-colors
                                                    "
                                                >
                                                    <Pencil
                                                        size={12}
                                                    />

                                                    Edit
                                                </button>


                                                {/* =================================
                                                   DELETE — ADMIN ONLY
                                                ================================== */}

                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowDeleteConfirm(
                                                                employee
                                                            )
                                                        }
                                                        className="
                                                            shrink-0
                                                            inline-flex
                                                            items-center
                                                            justify-center
                                                            gap-1.5
                                                            px-3
                                                            py-1.5
                                                            rounded-lg
                                                            text-[11px]
                                                            font-bold
                                                            whitespace-nowrap
                                                            cursor-pointer
                                                            bg-red-600
                                                            text-white
                                                            hover:bg-red-700
                                                            dark:bg-[#A32D2D]
                                                            dark:hover:bg-[#C43B3B]
                                                            transition-colors
                                                        "
                                                    >
                                                        <Trash2
                                                            size={12}
                                                        />

                                                        Delete
                                                    </button>
                                                )}

                                            </div>

                                        </div>


                                        {/* =================================
                                           MOBILE CARD
                                        ================================== */}

                                        <div
                                            className="
                                                md:hidden
                                                p-4
                                                bg-white
                                                dark:bg-[#0F1728]
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                    min-w-0
                                                "
                                            >

                                                <div
                                                    className="
                                                        shrink-0
                                                        w-11
                                                        h-11
                                                        rounded-full
                                                        flex
                                                        items-center
                                                        justify-center
                                                        text-xs
                                                        font-bold
                                                        bg-[#185FA5]
                                                        text-white
                                                    "
                                                >
                                                    {getInitials(
                                                        employee
                                                    )}
                                                </div>


                                                <div
                                                    className="
                                                        min-w-0
                                                        flex-1
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            font-bold
                                                            text-sm
                                                            truncate
                                                            text-slate-900
                                                            dark:text-[#E6F1FB]
                                                        "
                                                    >
                                                        {
                                                            employee.firstName
                                                        }
                                                        {' '}
                                                        {
                                                            employee.lastName
                                                        }
                                                    </div>

                                                    <div
                                                        className="
                                                            text-[11px]
                                                            truncate
                                                            text-slate-500
                                                            dark:text-[#5F7590]
                                                        "
                                                    >
                                                        {
                                                            employee.email ||
                                                            '—'
                                                        }
                                                    </div>

                                                </div>


                                                <Badge
                                                    status={
                                                        employee.active
                                                            ? 'ACTIVE'
                                                            : 'INACTIVE'
                                                    }
                                                />

                                            </div>


                                            <div
                                                className="
                                                    grid
                                                    grid-cols-2
                                                    gap-3
                                                    mt-4
                                                "
                                            >

                                                <div>
                                                    <p
                                                        className="
                                                            text-[10px]
                                                            uppercase
                                                            font-bold
                                                            tracking-wider
                                                            text-slate-400
                                                            dark:text-[#6F86A3]
                                                        "
                                                    >
                                                        EMP ID
                                                    </p>

                                                    <p
                                                        className="
                                                            text-xs
                                                            mt-1
                                                            font-semibold
                                                            text-slate-700
                                                            dark:text-[#B5D4F4]
                                                        "
                                                    >
                                                        {
                                                            employee.employeeId ||
                                                            '—'
                                                        }
                                                    </p>
                                                </div>


                                                <div>
                                                    <p
                                                        className="
                                                            text-[10px]
                                                            uppercase
                                                            font-bold
                                                            tracking-wider
                                                            text-slate-400
                                                            dark:text-[#6F86A3]
                                                        "
                                                    >
                                                        ROLE
                                                    </p>

                                                    <div className="mt-1">
                                                        <Badge
                                                            status={
                                                                employee.role
                                                            }
                                                        />
                                                    </div>
                                                </div>


                                                <div>
                                                    <p
                                                        className="
                                                            text-[10px]
                                                            uppercase
                                                            font-bold
                                                            tracking-wider
                                                            text-slate-400
                                                            dark:text-[#6F86A3]
                                                        "
                                                    >
                                                        DEPARTMENT
                                                    </p>

                                                    <p
                                                        className="
                                                            text-xs
                                                            mt-1
                                                            truncate
                                                            text-slate-700
                                                            dark:text-[#B5D4F4]
                                                        "
                                                    >
                                                        {
                                                            employee.department ||
                                                            '—'
                                                        }
                                                    </p>
                                                </div>


                                                <div>
                                                    <p
                                                        className="
                                                            text-[10px]
                                                            uppercase
                                                            font-bold
                                                            tracking-wider
                                                            text-slate-400
                                                            dark:text-[#6F86A3]
                                                        "
                                                    >
                                                        DESIGNATION
                                                    </p>

                                                    <p
                                                        className="
                                                            text-xs
                                                            mt-1
                                                            truncate
                                                            text-slate-700
                                                            dark:text-[#B5D4F4]
                                                        "
                                                    >
                                                        {
                                                            employee.designation ||
                                                            '—'
                                                        }
                                                    </p>
                                                </div>

                                            </div>


                                            {/* MOBILE ACTIONS */}

                                            <div
                                                className="
                                                    flex
                                                    gap-2
                                                    mt-4
                                                "
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(
                                                            employee
                                                        )
                                                    }
                                                    className="
                                                        flex-1
                                                        inline-flex
                                                        items-center
                                                        justify-center
                                                        gap-2
                                                        py-2.5
                                                        rounded-lg
                                                        text-xs
                                                        font-bold
                                                        bg-blue-600
                                                        text-white
                                                        hover:bg-blue-700
                                                        cursor-pointer
                                                        transition-colors
                                                    "
                                                >
                                                    <Pencil
                                                        size={14}
                                                    />

                                                    Edit
                                                </button>


                                                {/* ADMIN ONLY */}

                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowDeleteConfirm(
                                                                employee
                                                            )
                                                        }
                                                        className="
                                                            flex-1
                                                            inline-flex
                                                            items-center
                                                            justify-center
                                                            gap-2
                                                            py-2.5
                                                            rounded-lg
                                                            text-xs
                                                            font-bold
                                                            bg-red-600
                                                            text-white
                                                            hover:bg-red-700
                                                            dark:bg-[#A32D2D]
                                                            dark:hover:bg-[#C43B3B]
                                                            cursor-pointer
                                                            transition-colors
                                                        "
                                                    >
                                                        <Trash2
                                                            size={14}
                                                        />

                                                        Delete
                                                    </button>
                                                )}

                                            </div>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}


                    {/* =================================================
                       PAGINATION
                    ================================================= */}

                    {!loading &&
                        employees.length > 0 &&
                        totalPages > 1 && (

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    items-center
                                    justify-center
                                    gap-2
                                    px-5
                                    py-4
                                    border-t
                                    border-slate-200
                                    dark:border-[#1B2740]
                                    bg-white
                                    dark:bg-[#0F1728]
                                "
                            >

                                <button
                                    type="button"
                                    disabled={
                                        page === 0
                                    }
                                    onClick={() =>
                                        setPage(
                                            (previous) =>
                                                Math.max(
                                                    0,
                                                    previous - 1
                                                )
                                        )
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-3
                                        py-2
                                        rounded-lg
                                        text-xs
                                        font-semibold
                                        border
                                        bg-white
                                        border-slate-300
                                        text-slate-700
                                        hover:bg-slate-50
                                        dark:bg-[#111A2C]
                                        dark:border-[#223148]
                                        dark:text-[#B5D4F4]
                                        dark:hover:bg-[#162239]
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                        cursor-pointer
                                        transition-colors
                                    "
                                >
                                    <ChevronLeft
                                        size={14}
                                    />

                                    Prev
                                </button>


                                <span
                                    className="
                                        text-xs
                                        px-3
                                        py-2
                                        rounded-lg
                                        bg-slate-50
                                        text-slate-600
                                        dark:bg-[#111A2C]
                                        dark:text-[#B5D4F4]
                                        whitespace-nowrap
                                    "
                                >
                                    Page{' '}
                                    <strong>
                                        {page + 1}
                                    </strong>
                                    {' '}of{' '}
                                    <strong>
                                        {totalPages}
                                    </strong>
                                </span>


                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        totalPages - 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (previous) =>
                                                Math.min(
                                                    totalPages - 1,
                                                    previous + 1
                                                )
                                        )
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-3
                                        py-2
                                        rounded-lg
                                        text-xs
                                        font-semibold
                                        border
                                        bg-white
                                        border-slate-300
                                        text-slate-700
                                        hover:bg-slate-50
                                        dark:bg-[#111A2C]
                                        dark:border-[#223148]
                                        dark:text-[#B5D4F4]
                                        dark:hover:bg-[#162239]
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                        cursor-pointer
                                        transition-colors
                                    "
                                >
                                    Next

                                    <ChevronRight
                                        size={14}
                                    />
                                </button>

                            </div>
                        )}

                </div>

            </div>


            {/* =====================================================
               ADD / EDIT MODAL
            ====================================================== */}

            {showForm && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-black/50
                        backdrop-blur-sm
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeForm();
                        }
                    }}
                >

                    <div
                        className="
                            w-full
                            max-w-[680px]
                            max-h-[92vh]
                            overflow-y-auto
                            rounded-2xl
                            border
                            bg-white
                            border-slate-200
                            shadow-2xl
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                        "
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div
                            className="
                                sticky
                                top-0
                                z-10
                                flex
                                items-center
                                justify-between
                                gap-3
                                px-6
                                py-5
                                border-b
                                bg-white
                                border-slate-200
                                dark:bg-[#0F1728]
                                dark:border-[#1B2740]
                            "
                        >

                            <div>

                                <h2
                                    className="
                                        text-lg
                                        font-extrabold
                                        text-slate-900
                                        dark:text-[#E6F1FB]
                                    "
                                >
                                    {editMode
                                        ? 'Edit Employee'
                                        : 'Add New Employee'}
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-[11px]
                                        text-slate-500
                                        dark:text-[#7C93B3]
                                    "
                                >
                                    {editMode
                                        ? 'Update employee information and access details.'
                                        : 'Create a new employee account and profile.'}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={submitting}
                                className="
                                    shrink-0
                                    w-9
                                    h-9
                                    rounded-lg
                                    flex
                                    items-center
                                    justify-center
                                    cursor-pointer
                                    text-slate-500
                                    hover:bg-slate-100
                                    dark:text-[#7C93B3]
                                    dark:hover:bg-[#162239]
                                    disabled:opacity-40
                                "
                            >
                                <X
                                    size={18}
                                />
                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="p-6 sm:p-7"
                        >

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-3.5
                                "
                            >

                                <InputField
                                    label="Employee ID"
                                    name="employeeId"
                                    required
                                    placeholder="EMP0004"
                                    value={
                                        form.employeeId
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="First Name"
                                    name="firstName"
                                    required
                                    placeholder="John"
                                    value={
                                        form.firstName
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Last Name"
                                    name="lastName"
                                    required
                                    placeholder="Doe"
                                    value={
                                        form.lastName
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="john@hrms.com"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                {/* PASSWORD */}

                                <div
                                    className="relative"
                                >

                                    <InputField
                                        label={
                                            editMode
                                                ? 'Password (leave blank to keep)'
                                                : 'Password'
                                        }
                                        name="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        required={
                                            !editMode
                                        }
                                        placeholder="Min 8 characters"
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleFieldChange
                                        }
                                        inputClassName="!pr-10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-[36px]
                                            cursor-pointer
                                            text-slate-500
                                            dark:text-[#7C93B3]
                                        "
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <FaEye
                                                size={14}
                                            />
                                        ) : (
                                            <FaEyeSlash
                                                size={14}
                                            />
                                        )}
                                    </button>

                                </div>


                                <InputField
                                    label="Phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                    numericOnly
                                    maxLength={10}
                                />


                                <InputField
                                    label="Department"
                                    name="department"
                                    placeholder="IT"
                                    value={
                                        form.department
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Designation"
                                    name="designation"
                                    placeholder="Software Engineer"
                                    value={
                                        form.designation
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Basic Salary"
                                    name="basicSalary"
                                    type="number"
                                    placeholder="50000"
                                    value={
                                        form.basicSalary
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Date of Joining"
                                    name="dateOfJoining"
                                    type="date"
                                    value={
                                        form.dateOfJoining
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />


                                <InputField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={
                                        form.dateOfBirth
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                    max={today}
                                />

                            </div>


                            {/* ROLE */}

                            <div className="mt-4">

                                <label
                                    className="
                                        block
                                        mb-1.5
                                        text-xs
                                        font-semibold
                                        text-slate-700
                                        dark:text-[#B5D4F4]
                                    "
                                >
                                    Role
                                    {' '}
                                    <span
                                        className="
                                            text-red-500
                                            dark:text-[#F09595]
                                        "
                                    >
                                        *
                                    </span>
                                </label>


                                <div
                                    className="
                                        relative
                                    "
                                >

                                    <select
                                        value={
                                            form.role
                                        }
                                        onChange={(event) =>
                                            handleFieldChange(
                                                'role',
                                                event.target.value
                                            )
                                        }
                                        className={
                                            INPUT_CLASS
                                        }
                                    >

                                        <option value="EMPLOYEE">
                                            EMPLOYEE
                                        </option>

                                        <option value="HR">
                                            HR
                                        </option>

                                        <option value="ADMIN">
                                            ADMIN
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    gap-2.5
                                    mt-7
                                "
                            >

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-semibold
                                        cursor-pointer
                                        bg-slate-100
                                        text-slate-700
                                        hover:bg-slate-200
                                        dark:bg-[#111A2C]
                                        dark:text-[#B5D4F4]
                                        dark:hover:bg-[#162239]
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        submitting
                                    }
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-bold
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        cursor-pointer
                                        bg-indigo-600
                                        text-white
                                        hover:bg-indigo-700
                                        dark:bg-[#378ADD]
                                        dark:text-[#042C53]
                                        dark:hover:bg-[#4A9BEA]
                                        disabled:opacity-60
                                        disabled:cursor-not-allowed
                                    "
                                >

                                    {submitting ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="
                                                    animate-spin
                                                "
                                            />

                                            Saving...
                                        </>
                                    ) : editMode ? (
                                        'Update Employee'
                                    ) : (
                                        'Add Employee'
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* =====================================================
               DELETE CONFIRMATION MODAL
               
               This modal is ADMIN ONLY.
            ====================================================== */}

            {showDeleteConfirm &&
                isAdmin && (

                    <div
                        className="
                            fixed
                            inset-0
                            z-[100]
                            flex
                            items-center
                            justify-center
                            p-4
                            bg-black/50
                            backdrop-blur-sm
                        "
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setShowDeleteConfirm(
                                    null
                                );
                            }
                        }}
                    >

                        <div
                            className="
                                w-full
                                max-w-[430px]
                                rounded-2xl
                                p-7
                                text-center
                                border
                                bg-white
                                border-slate-200
                                shadow-2xl
                                dark:bg-[#0F1728]
                                dark:border-[#1B2740]
                            "
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div
                                className="
                                    w-14
                                    h-14
                                    mx-auto
                                    mb-4
                                    rounded-2xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-red-50
                                    text-red-500
                                    dark:bg-[#3A1717]
                                    dark:text-[#F09595]
                                "
                            >
                                <AlertTriangle
                                    size={27}
                                    strokeWidth={1.8}
                                />
                            </div>


                            <h2
                                className="
                                    text-lg
                                    font-extrabold
                                    text-slate-900
                                    dark:text-[#E6F1FB]
                                "
                            >
                                Delete Employee?
                            </h2>


                            <p
                                className="
                                    mt-2
                                    text-[13px]
                                    leading-5
                                    text-slate-500
                                    dark:text-[#7C93B3]
                                "
                            >
                                Are you sure you want to
                                delete
                                {' '}
                                <strong
                                    className="
                                        text-slate-900
                                        dark:text-[#E6F1FB]
                                    "
                                >
                                    {
                                        showDeleteConfirm.firstName
                                    }
                                    {' '}
                                    {
                                        showDeleteConfirm.lastName
                                    }
                                </strong>
                                ?
                                <br />
                                This action cannot be undone.
                            </p>


                            <div
                                className="
                                    flex
                                    gap-2.5
                                    mt-6
                                "
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteConfirm(
                                            null
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-semibold
                                        cursor-pointer
                                        bg-slate-100
                                        text-slate-700
                                        hover:bg-slate-200
                                        dark:bg-[#111A2C]
                                        dark:text-[#B5D4F4]
                                        dark:hover:bg-[#162239]
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    disabled={
                                        deleting ===
                                        showDeleteConfirm.id
                                    }
                                    onClick={() =>
                                        handleDelete(
                                            showDeleteConfirm
                                        )
                                    }
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-bold
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        cursor-pointer
                                        bg-red-600
                                        text-white
                                        hover:bg-red-700
                                        dark:bg-[#A32D2D]
                                        dark:hover:bg-[#C43B3B]
                                        disabled:opacity-60
                                        disabled:cursor-not-allowed
                                    "
                                >

                                    {deleting ===
                                        showDeleteConfirm.id ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="
                                                    animate-spin
                                                "
                                            />

                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2
                                                size={15}
                                            />

                                            Yes, Delete
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}