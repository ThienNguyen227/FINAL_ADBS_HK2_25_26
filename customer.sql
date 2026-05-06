USE [master]
GO
/****** Object:  Database [customer_services]    Script Date: 5/5/2026 6:16:13 PM ******/
CREATE DATABASE [customer_services]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'customer_services', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\customer_services.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'customer_services_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\customer_services_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [customer_services].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [customer_services] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [customer_services] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [customer_services] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [customer_services] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [customer_services] SET ARITHABORT OFF 
GO
ALTER DATABASE [customer_services] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [customer_services] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [customer_services] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [customer_services] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [customer_services] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [customer_services] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [customer_services] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [customer_services] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [customer_services] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [customer_services] SET  DISABLE_BROKER 
GO
ALTER DATABASE [customer_services] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [customer_services] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [customer_services] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [customer_services] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [customer_services] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [customer_services] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [customer_services] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [customer_services] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [customer_services] SET  MULTI_USER 
GO
ALTER DATABASE [customer_services] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [customer_services] SET DB_CHAINING OFF 
GO
ALTER DATABASE [customer_services] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [customer_services] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [customer_services] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [customer_services] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [customer_services] SET QUERY_STORE = ON
GO
ALTER DATABASE [customer_services] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [customer_services]
GO
/****** Object:  Table [dbo].[Contracts]    Script Date: 5/5/2026 6:16:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Contracts](
	[contract_id] [int] IDENTITY(1,1) NOT NULL,
	[contract_customer_id] [int] NOT NULL,
	[contract_customer_fullname] [nvarchar](255) NOT NULL,
	[contract_customer_address] [nvarchar](255) NOT NULL,
	[contract_customer_phone] [nvarchar](20) NOT NULL,
	[contract_customer_email] [nvarchar](255) NOT NULL,
	[contract_type_id] [int] NOT NULL,
	[contract_rate] [decimal](10, 2) NOT NULL,
	[contract_start_date] [date] NOT NULL,
	[contract_end_date] [date] NOT NULL,
	[contract_status] [varchar](20) NULL,
	[contract_created_at] [datetime2](7) NULL,
	[contract_updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[contract_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ContractTypes]    Script Date: 5/5/2026 6:16:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ContractTypes](
	[contract_type_id] [int] IDENTITY(1,1) NOT NULL,
	[contract_type_name] [nvarchar](100) NOT NULL,
	[contract_type_rate] [decimal](10, 2) NOT NULL,
	[contract_type_created_at] [datetime2](7) NULL,
	[contract_type_updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[contract_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customers]    Script Date: 5/5/2026 6:16:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customers](
	[customer_id] [int] IDENTITY(1,1) NOT NULL,
	[customer_user_id] [int] NOT NULL,
	[customer_fullname] [nvarchar](150) NULL,
	[customer_address] [nvarchar](255) NULL,
	[customer_priority] [varchar](20) NULL,
	[customer_status] [nvarchar](50) NULL,
	[customer_created_at] [datetime2](7) NULL,
	[customer_updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Contracts] ON 

INSERT [dbo].[Contracts] ([contract_id], [contract_customer_id], [contract_customer_fullname], [contract_customer_address], [contract_customer_phone], [contract_customer_email], [contract_type_id], [contract_rate], [contract_start_date], [contract_end_date], [contract_status], [contract_created_at], [contract_updated_at]) VALUES (15, 19, N'Antony Ng', N'Q1', N'0123456789', N'test@gmail.com', 1, CAST(1500.00 AS Decimal(10, 2)), CAST(N'2026-05-03' AS Date), CAST(N'2027-05-03' AS Date), N'TERMINATED', CAST(N'2026-05-03T19:44:42.3866667' AS DateTime2), CAST(N'2026-05-03T19:45:35.6666667' AS DateTime2))
INSERT [dbo].[Contracts] ([contract_id], [contract_customer_id], [contract_customer_fullname], [contract_customer_address], [contract_customer_phone], [contract_customer_email], [contract_type_id], [contract_rate], [contract_start_date], [contract_end_date], [contract_status], [contract_created_at], [contract_updated_at]) VALUES (16, 19, N'Antony Ng', N'Q1', N'0123456789', N'test@gmail.com', 1, CAST(1500.00 AS Decimal(10, 2)), CAST(N'2026-05-03' AS Date), CAST(N'2027-05-03' AS Date), N'ACTIVE', CAST(N'2026-05-03T19:46:29.9633333' AS DateTime2), NULL)
INSERT [dbo].[Contracts] ([contract_id], [contract_customer_id], [contract_customer_fullname], [contract_customer_address], [contract_customer_phone], [contract_customer_email], [contract_type_id], [contract_rate], [contract_start_date], [contract_end_date], [contract_status], [contract_created_at], [contract_updated_at]) VALUES (18, 20, N'Phan Nguyễn Quốc Thắng', N'Q2', N'840000000', N'tenk8595@gmail.com', 1, CAST(1500.00 AS Decimal(10, 2)), CAST(N'2026-05-05' AS Date), CAST(N'2027-05-05' AS Date), N'ACTIVE', CAST(N'2026-05-05T12:24:27.2000000' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[Contracts] OFF
GO
SET IDENTITY_INSERT [dbo].[ContractTypes] ON 

INSERT [dbo].[ContractTypes] ([contract_type_id], [contract_type_name], [contract_type_rate], [contract_type_created_at], [contract_type_updated_at]) VALUES (1, N'Hộ gia đình', CAST(1500.00 AS Decimal(10, 2)), CAST(N'2026-04-22T21:40:09.3400000' AS DateTime2), NULL)
INSERT [dbo].[ContractTypes] ([contract_type_id], [contract_type_name], [contract_type_rate], [contract_type_created_at], [contract_type_updated_at]) VALUES (2, N'Doanh nghiệp', CAST(2500.00 AS Decimal(10, 2)), CAST(N'2026-04-22T21:40:09.3400000' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[ContractTypes] OFF
GO
SET IDENTITY_INSERT [dbo].[Customers] ON 

INSERT [dbo].[Customers] ([customer_id], [customer_user_id], [customer_fullname], [customer_address], [customer_priority], [customer_created_at], [customer_updated_at]) VALUES (19, 33, N'Antony Ng', N'Q1', N'NORMAL', CAST(N'2026-05-02T18:38:55.1466667' AS DateTime2), NULL)
INSERT [dbo].[Customers] ([customer_id], [customer_user_id], [customer_fullname], [customer_address], [customer_priority], [customer_created_at], [customer_updated_at]) VALUES (20, 74, N'Phan Nguyễn Quốc Thắng', N'Q2', N'NORMAL', CAST(N'2026-05-05T12:22:26.5033333' AS DateTime2), CAST(N'2026-05-05T12:22:26.5033333' AS DateTime2))
SET IDENTITY_INSERT [dbo].[Customers] OFF
GO
/****** Object:  Index [UQ__Customer__C9955625F3C39405]    Script Date: 5/5/2026 6:16:13 PM ******/
ALTER TABLE [dbo].[Customers] ADD UNIQUE NONCLUSTERED 
(
	[customer_user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Contracts] ADD  DEFAULT (getdate()) FOR [contract_created_at]
GO
ALTER TABLE [dbo].[ContractTypes] ADD  DEFAULT (getdate()) FOR [contract_type_created_at]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT ('NORMAL') FOR [customer_priority]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT (getdate()) FOR [customer_created_at]
GO
ALTER TABLE [dbo].[Contracts]  WITH CHECK ADD  CONSTRAINT [FK_Contracts_ContractTypes] FOREIGN KEY([contract_type_id])
REFERENCES [dbo].[ContractTypes] ([contract_type_id])
GO
ALTER TABLE [dbo].[Contracts] CHECK CONSTRAINT [FK_Contracts_ContractTypes]
GO
ALTER TABLE [dbo].[Contracts]  WITH CHECK ADD  CONSTRAINT [FK_Contracts_Customers] FOREIGN KEY([contract_customer_id])
REFERENCES [dbo].[Customers] ([customer_id])
GO
ALTER TABLE [dbo].[Contracts] CHECK CONSTRAINT [FK_Contracts_Customers]
GO
ALTER TABLE [dbo].[Contracts]  WITH CHECK ADD CHECK  (([contract_status]='TERMINATED' OR [contract_status]='EXPIRED' OR [contract_status]='ACTIVE'))
GO
ALTER TABLE [dbo].[Customers]  WITH CHECK ADD CHECK  (([customer_priority]='CRITICAL' OR [customer_priority]='NORMAL'))
GO
USE [master]
GO
ALTER DATABASE [customer_services] SET  READ_WRITE 
GO

-- Trigger: Tự động cập nhật mức độ ưu tiên lên CRITICAL khi có thông báo mất điện
CREATE TRIGGER trg_CriticalPriority
ON Customers
AFTER UPDATE
AS
BEGIN
    -- Nếu trạng thái vừa bị thay đổi
    IF UPDATE(customer_status)
    BEGIN
        -- 1. Chuyển thành CRITICAL nếu mất điện
        UPDATE Customers
        SET customer_priority = 'CRITICAL'
        FROM Customers C
        INNER JOIN inserted I ON C.customer_id = I.customer_id
        WHERE I.customer_status = 'OFFLINE_DETECTED';

        -- 2. Chuyển lại thành NORMAL nếu có điện lại (ONLINE)
        UPDATE Customers
        SET customer_priority = 'NORMAL'
        FROM Customers C
        INNER JOIN inserted I ON C.customer_id = I.customer_id
        WHERE I.customer_status = 'ONLINE';
    END
END;
GO
