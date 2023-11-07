

$(function () {

    $("#SalaryFilter :input").on('input', function () {
        dataTable.ajax.reload();
    });
    $('#SalaryFilter div').addClass('col-sm-3').parent().addClass('row');


    //After abp v7.2 use dynamicForm 'column-size' instead of the following settings
    //$('#SalaryCollapse div').addClass('col-sm-3').parent().addClass('row');

    var getFilter = function () {
        var input = {};
        $("#SalaryFilter")
            .serializeArray()
            .forEach(function (data) {
                if (data.value != '') {
                    input[abp.utils.toCamelCase(data.name.replace(/SalaryFilter./g, ''))] = data.value;
                }
            })
        return input;
    };

    var l = abp.localization.getResource('HRMapp');

    var service = hRMapp.salarys.salary;
    var host_name = "https://localhost:44350";

    var createModal = new abp.ModalManager(host_name + '/Salarys/Salary/CreateModal');
    var createManyModal = new abp.ModalManager(host_name + '/Salarys/Salary/CreateManySalaryModal');
    var editModal = new abp.ModalManager(host_name + '/Salarys/Salary/EditModal');
    var viewModal = new abp.ModalManager(host_name + '/Salarys/Salary/ViewModal');
    var exportSalary = new abp.ModalManager(host_name + '/Salarys/Salary/ExportSalaryForMonthModal');
    var viewSalaryforMonth = new abp.ModalManager(host_name + '/Salarys/Salary/ViewSalaryForMonth');

    var dataTable = $('#SalaryTable').DataTable(abp.libs.datatables.normalizeConfiguration({
        processing: true,
        serverSide: true,
        paging: true,
        searching: false,//disable default searchbox
        autoWidth: false,
        scrollCollapse: true,
        order: [[0, "asc"]],
        ajax: abp.libs.datatables.createAjax(service.getList,getFilter),
        dom: 'Bfrtilp',
        buttons: [
            'copyHtml5',
            'excelHtml5',
            'pdfHtml5'
        ],
        lengthMenu: [
            [10, 25, 50, 9999999],
            [10, 25, 50, 'All']
        ],
        columnDefs: [
            {
                title: l('EmployeeName'),
                data: "employeeName",
                render: function(data, type, row){
                    return data ? "<a href='javascript:void(0);' class='ViewSalaryBtn' data-id='"+row.id+"'  style=\"text-decoration: none\">"+data+"</a>" : "";
                }
            },
            
            {
                width: "1%",
                title: l('AttendentForMonthMonth'),
                data: "attendentForMonthMonth",
                "render": function (data, type, full, meta) {
                    return data != null ? moment(data).format("MM-YYYY") : "";
                }
            },
            {
                width: "1%",
                title: l('AttendentForMonthCount'),
                data: "attendentForMonthCount"
            },
            {
                width: "1%",
                title: l('TotalSalary'),
                data: "totalSalary"
            },
            {
                className: "dt-center",
                width: "1%",
                title: l('Edit'),
                orderable: false,
                render: function (data,type,row) {
                    return abp.auth.isGranted('HRMapp.Salary.Update') ?  ` <a data-id="${row.id}" class="edit-button" href="#" > <i  class="fa fa-edit"></i> </a>`: "" ;
                }
            },

            {
                className: "dt-center",
                width: "1%",
                title: l('Delete'),
                orderable: false,
                render: function (data,type,row) {
                    return abp.auth.isGranted('HRMapp.Salary.Delete') ?  ` <a data-id="${row.id}" class="delete-button text-danger" href="#" > <i  class="fa fa-trash"></i> </a>`: "" ;
                }
            },
        ]
    }));


    // edit record
    $(document).on('click', '.edit-button', function (e) {
        editModal.open({id: this.dataset.id});
    });
    // delete record
    $(document).on('click', '.delete-button', function (e) {
        var id = this.dataset.id;
        abp.message.confirm(l('SalaryDeletionConfirmationMessage',id))
            .then(function(confirmed){
                if(confirmed){
                    service.delete(id)
                        .then(function () {
                            abp.notify.info(l('SuccessfullyDeleted'));
                            dataTable.ajax.reload();
                        });
                }
            });
    });
    //visible column
    dataTable.column([]).visible( false, false );

    createModal.onResult(function () {
        dataTable.ajax.reload();
    });
    createManyModal.onResult(function () {
        dataTable.ajax.reload();
    });

    editModal.onResult(function () {
        dataTable.ajax.reload();
    });
    exportSalary.onResult(function (e) {
        e.preventDefault();
        console.log("abc");
        var date = $("#ViewMonthModel_AttendentForMonthMonth").val();
        // Gọi AJAX để lấy dữ liệu từ server
        viewSalaryforMonth.open();
        $.ajax({
            url: '/api/app/salary/salary-for-month',
            method: 'GET',
            data: {  AttendentForMonthMonth: date  },
            success: function(data) {
                if (data) {
                    // Điền dữ liệu vào modal
                    fillModalWithData(data);
                    // Mở modal
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
 
    });

    function fillModalWithData(data) {
        $('#viewSalaryforMonthBody').empty(); // Xóa dữ liệu cũ trong bảng

        // Duyệt qua danh sách đối tượng và thêm dữ liệu vào bảng trong modal
        for (var i = 0; i < data.listSalarys.length; i++) {
            var item = data.listSalarys[i];
            var departmentNames = item.departmentName != null ? item.departmentName : ''
            var month = moment(item.attendentForMonthMonth).format("MM-YYYY")
            var row = '<tr>' +
                '<td>' + item.employeeName + '</td>' +
                '<td>' + departmentNames + '</td>' +
                '<td>' + month + '</td>' +
                '<td>' + item.attendentForMonthCount + '</td>' +
                '<td>' + item.coefficientSalary + '</td>' +
                '<td>' + item.totalSalary + '</td>' +
                '</tr>';

            $('#viewSalaryforMonthBody').append(row);
        }

        // Cập nhật thông tin về tháng lương trong phần tử có ID là #SalaryMonth (ví dụ: lấy thông tin từ phần tử đầu tiên trong danh sách)
        if (data.listSalarys.length > 0) {
            $("#SalaryMonth").text("Bảng lương tháng "+moment(data.listSalarys[0].attendentForMonthMonth).format("MM-YYYY"));
        } else {
            // Nếu không có dữ liệu, có thể cập nhật thông báo hoặc giá trị mặc định
            $("#SalaryMonth").text("Không có dữ liệu cho tháng này");
        }
    }
    $('#NewSalaryButton').click(function (e) {
        e.preventDefault();
        createModal.open();
    });
    viewSalaryforMonth.onOpen(function (){

        console.log("ab123c da mo modal");
        $('#exportSalaryPdfButton').on('click', function () {
            var element = $(".modal-body").html();
            console.log("danhannut");
            var opt = {
                margin: 10,
                filename: 'BangLuongTheoThang'+jQuery.now()+'.pdf',
                image: {type: 'jpeg', quality: 1},
                html2canvas: {scale: 2},
                jsPDF: {unit: 'mm', format: 'a4', orientation: 'landscape'}
            };
            html2pdf().set(opt).from(element).save();
        });
        
    })

    viewModal.onOpen(function () {
        console.log("ab123c da mo modal");
        $('#exportPdfButton').on('click', function () {
            var element = $(".modal-body").html();
            console.log("danhannut");
            var opt = {
                margin: 10,
                filename: 'BangLuong'+jQuery.now()+'.pdf',
                image: {type: 'jpeg', quality: 1},
                html2canvas: {scale: 2},
                jsPDF: {unit: 'mm', format: 'a4', orientation: 'landscape'}
            };
            html2pdf().set(opt).from(element).save();
        });
    });
    
    $('#NewManySalaryButton').click(function (e) {
        e.preventDefault();
        createManyModal.open();
    });
    
 $('#ExportSalaryButton').click(function (e) {
        e.preventDefault();
        exportSalary.open();
    });
 

    $(document).on('click','.ViewSalaryBtn', function (e) {
        e.preventDefault();
        console.log(e);
        var id = this.dataset.id;
        viewModal.open({id});
    });
    $('input.customcolumn').on('click', function (e) {
        // e.preventDefault();

        // Get the column API object
        var column = dataTable.column($(this).attr('id'));

        // Toggle the visibility
        column.visible(!column.visible());
    });
});
